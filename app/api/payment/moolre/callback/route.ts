import { NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/payments/fetch-with-timeout';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendOrderConfirmation } from '@/lib/notifications';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

/**
 * Moolre Callback Payload Structure (from their actual API):
 * {
 *   "status": 1,
 *   "code": "P01",
 *   "message": "Transaction Successful",
 *   "data": {
 *     "txtstatus": 1,
 *     "payer": "233535998837",
 *     "terminalid": "",
 *     "accountnumber": "10789906062911",
 *     "name": "",
 *     "amount": "2",
 *     "value": "2",
 *     "transactionid": "42252702",
 *     "externalref": "ORD-1770330034217-441",
 *     "thirdpartyref": "74658410493"
 *   },
 *   "secret": "c23bc2ab-...",
 *   "ts": "2026-02-05 22:21:16",
 *   "go": null
 * }
 */

export async function POST(req: Request) {
    console.log('[Callback] POST received at', new Date().toISOString());

    try {
        // Rate limiting
        const clientId = getClientIdentifier(req);
        const rateLimitResult = checkRateLimit(`callback:${clientId}`, RATE_LIMITS.callback);

        if (!rateLimitResult.success) {
            console.warn('[Callback] Rate limited:', clientId);
            return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
        }

        let body: any = {};
        const contentType = req.headers.get('content-type') || '';

        // Parse body
        try {
            if (contentType.includes('application/json')) {
                body = await req.json();
            } else if (contentType.includes('form')) {
                const formData = await req.formData();
                body = Object.fromEntries(formData.entries());
            } else {
                const rawText = await req.text();
                try {
                    body = JSON.parse(rawText);
                } catch {
                    try {
                        body = Object.fromEntries(new URLSearchParams(rawText).entries());
                    } catch {
                        console.warn('[Callback] Could not parse body');
                    }
                }
            }
        } catch (parseError) {
            console.error('[Callback] Body parsing failed');
            return NextResponse.json({ success: false, message: 'Invalid Request Body' }, { status: 400 });
        }

        console.log('[Callback] Body keys:', Object.keys(body).join(', '));
        console.log('[Callback] Data keys:', body.data ? Object.keys(body.data).join(', ') : 'no data object');

        // ============================================================
        // SECURITY: Verify callback secret when Moolre sends one.
        // Unsigned callbacks require a live Moolre status check before
        // marking paid (see success path below).
        // ============================================================
        const expectedSecret = process.env.MOOLRE_CALLBACK_SECRET;
        const secretVerified = !!(body.secret && expectedSecret && body.secret === expectedSecret);
        if (body.secret && expectedSecret && body.secret !== expectedSecret) {
            console.error('[Callback] SECRET MISMATCH — rejecting potential spoof. Got:',
                String(body.secret).substring(0, 8) + '...');
            return NextResponse.json({ success: false, message: 'Invalid callback secret' }, { status: 403 });
        }
        if (!expectedSecret) {
            console.warn('[Callback] WARNING: MOOLRE_CALLBACK_SECRET not configured.');
        } else if (!body.secret) {
            console.warn('[Callback] No secret in payload — will verify via Moolre status API.');
        } else if (secretVerified) {
            console.log('[Callback] Secret verified OK');
        }

        // ============================================================
        // EXTRACT FIELDS - Moolre nests payment data inside body.data
        // ============================================================
        const data = body.data || {};

        // Order reference: check body.data.externalref first, then top-level fallbacks
        const rawExternalRef =
            data.externalref ||
            data.external_reference ||
            data.orderRef ||
            body.externalref ||
            body.orderRef ||
            body.external_reference;

        // Strip retry suffix (e.g., "ORD-123-R1770000000" -> "ORD-123")
        const merchantOrderRef = rawExternalRef
            ? rawExternalRef.replace(/-R\d+$/, '')
            : (data.metadata?.original_order_number || body.metadata?.original_order_number);

        // Moolre's transaction reference
        const moolreReference =
            data.transactionid ||
            data.thirdpartyref ||
            body.reference ||
            'callback';

        // Payment status:
        //   body.status === 1            => API call succeeded
        //   data.txstatus === 1          => transaction was successful (actual field)
        //   data.txtstatus === 1         => same value, alternative spelling in Moolre docs
        // We accept either spelling because Moolre's live API and their docs disagree.
        const apiStatus = body.status;
        const txStatus = data.txstatus ?? data.txtstatus;
        const messageStr = String(body.message || '').toLowerCase();

        console.log('[Callback] Order ref:', merchantOrderRef,
            '| API status:', apiStatus,
            '| TX status:', txStatus,
            '| Message:', body.message,
            '| Moolre ref:', moolreReference);

        if (!merchantOrderRef) {
            console.error('[Callback] Missing order reference. Body:', JSON.stringify(body).substring(0, 500));
            return NextResponse.json({ success: false, message: 'Missing order reference' }, { status: 400 });
        }

        // ============================================================
        // Success validation
        // Accept the payment if EITHER status field signals success
        // and there's no explicit failure signal in the message or
        // transaction status. We deliberately don't require BOTH —
        // Moolre sometimes omits one of these fields in real payloads.
        // ============================================================
        const apiOk = (apiStatus === 1 || apiStatus === '1');
        const txOk = (txStatus === 1 || txStatus === '1');

        const hasExplicitFailure =
            txStatus === 0 || txStatus === '0' ||
            txStatus === -1 || txStatus === '-1' ||
            messageStr.includes('fail') ||
            messageStr.includes('cancel') ||
            messageStr.includes('declin') ||
            messageStr.includes('error');

        const isSuccess = (apiOk || txOk) && !hasExplicitFailure;

        if (isSuccess) {
            console.log(`[Callback] Payment SUCCESS for Order ${merchantOrderRef}`);

            // Check if order exists
            const { data: existingOrder, error: fetchError } = await supabaseAdmin
                .from('orders')
                .select('id, order_number, payment_status, total, metadata')
                .eq('order_number', merchantOrderRef)
                .single();

            if (fetchError || !existingOrder) {
                console.error('[Callback] Order not found:', merchantOrderRef);
                return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
            }

            // Already paid - idempotent
            if (existingOrder.payment_status === 'paid') {
                console.log('[Callback] Order already paid, skipping:', merchantOrderRef);
                return NextResponse.json({ success: true, message: 'Order already processed' });
            }

            const expectedAmount = Number(existingOrder.total);

            if (secretVerified) {
                // ============================================================
                // SECURITY: Signed callback — verify amount from payload
                // ============================================================
                const callbackAmount = data.amount ? parseFloat(data.amount) : (body.amount ? parseFloat(body.amount) : null);
                if (callbackAmount !== null) {
                    if (Math.abs(callbackAmount - expectedAmount) > 0.01) {
                        console.error('[Callback] AMOUNT MISMATCH — REJECTING! Expected:', expectedAmount, 'Got:', callbackAmount, 'Order:', merchantOrderRef);
                        return NextResponse.json({
                            success: false,
                            message: 'Payment amount does not match order total'
                        }, { status: 400 });
                    }
                }
            } else if (!body.secret) {
                // ============================================================
                // SECURITY: Unsigned callback — confirm via Moolre status API
                // ============================================================
                if (!process.env.MOOLRE_API_USER || !process.env.MOOLRE_API_PUBKEY) {
                    console.error('[Callback] Unsigned callback but Moolre API credentials missing');
                    return NextResponse.json({
                        success: false,
                        message: 'Payment verification unavailable'
                    }, { status: 503 });
                }

                const externalRefToCheck = existingOrder.metadata?.moolre_externalref || rawExternalRef;
                console.log('[Callback] Verifying unsigned callback via Moolre status API:', externalRefToCheck);

                let moolreApiVerified = false;
                try {
                    const checkResponse = await fetchWithTimeout('https://api.moolre.com/embed/status', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-API-USER': process.env.MOOLRE_API_USER,
                            'X-API-PUBKEY': process.env.MOOLRE_API_PUBKEY
                        },
                        body: JSON.stringify({ externalref: externalRefToCheck })
                    }, 15_000);

                    const checkResult = await checkResponse.json();
                    console.log('[Callback] Moolre status API response:', JSON.stringify(checkResult));

                    const statusStr = String(checkResult.data?.status || '').toLowerCase();
                    moolreApiVerified =
                        (checkResult.status === 1 && checkResult.data) &&
                        (statusStr === 'success' || statusStr === 'successful' || statusStr === 'completed' || statusStr === 'paid');

                    if (moolreApiVerified && checkResult.data?.amount) {
                        const paidAmount = parseFloat(checkResult.data.amount);
                        if (Math.abs(paidAmount - expectedAmount) > 0.01) {
                            console.error('[Callback] AMOUNT MISMATCH via API! Expected:', expectedAmount, 'Got:', paidAmount);
                            moolreApiVerified = false;
                        }
                    }
                } catch (moolreError: any) {
                    console.warn('[Callback] Moolre status API check failed:', moolreError.message);
                }

                if (!moolreApiVerified) {
                    console.error('[Callback] Unsigned callback not confirmed by Moolre API:', merchantOrderRef);
                    return NextResponse.json({
                        success: false,
                        message: 'Payment not confirmed by payment provider'
                    }, { status: 400 });
                }
            } else {
                // Secret present but could not be verified (e.g. MOOLRE_CALLBACK_SECRET unset)
                const callbackAmount = data.amount ? parseFloat(data.amount) : (body.amount ? parseFloat(body.amount) : null);
                if (callbackAmount !== null) {
                    if (Math.abs(callbackAmount - expectedAmount) > 0.01) {
                        console.error('[Callback] AMOUNT MISMATCH — REJECTING! Expected:', expectedAmount, 'Got:', callbackAmount, 'Order:', merchantOrderRef);
                        return NextResponse.json({
                            success: false,
                            message: 'Payment amount does not match order total'
                        }, { status: 400 });
                    }
                }
            }

            // Mark order as paid via RPC
            const { data: orderJson, error: updateError } = await supabaseAdmin
                .rpc('mark_order_paid', {
                    order_ref: merchantOrderRef,
                    moolre_ref: String(moolreReference)
                });

            if (updateError) {
                console.error('[Callback] RPC Error:', updateError.message);
                return NextResponse.json({ success: false, message: 'Database update failed' }, { status: 500 });
            }

            if (!orderJson) {
                console.error('[Callback] Order not found after RPC:', merchantOrderRef);
                return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
            }

            console.log('[Callback] Order updated! ID:', orderJson.id, '| Status:', orderJson.status);

            // Update customer stats
            try {
                if (orderJson.email) {
                    await supabaseAdmin.rpc('update_customer_stats', {
                        p_customer_email: orderJson.email,
                        p_order_total: orderJson.total
                    });
                }
            } catch (statsError: any) {
                console.error('[Callback] Customer stats failed:', statsError.message);
            }

            // Send SMS + Email notifications (fire-and-forget — don't block callback response)
            console.log('[Callback] Queueing notifications for:', orderJson.order_number);
            void sendOrderConfirmation(orderJson).catch((notifyError: Error) => {
                console.error('[Callback] Notification failed:', notifyError.message);
            });

            return NextResponse.json({ success: true, message: 'Payment verified and Order Updated' });

        } else {
            console.log(`[Callback] Payment FAILED for ${merchantOrderRef} | Status: ${apiStatus} | TX: ${txStatus}`);

            // Merge with existing metadata so we don't wipe out cart/customer info
            const { data: failedOrderMeta } = await supabaseAdmin
                .from('orders')
                .select('metadata')
                .eq('order_number', merchantOrderRef)
                .single();

            const mergedFailureMetadata = {
                ...(failedOrderMeta?.metadata || {}),
                moolre_reference: moolreReference,
                failure_reason: body.message || 'Payment failed'
            };

            await supabaseAdmin
                .from('orders')
                .update({
                    payment_status: 'failed',
                    metadata: mergedFailureMetadata
                })
                .eq('order_number', merchantOrderRef);

            return NextResponse.json({ success: false, message: 'Payment not successful' });
        }

    } catch (error: any) {
        console.error('[Callback] Critical Error:', error.message);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    return NextResponse.json({ message: 'Moolre callback endpoint ready', timestamp: new Date().toISOString() });
}
