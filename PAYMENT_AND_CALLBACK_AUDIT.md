# Payment and Callback Audit

**Store:** Raymahomes / Rayma Kitchenware  
**Scope:** Implemented payment integrations only  
**Date:** July 2026

---

## Payment providers

| Provider | Status in repository |
|----------|---------------------|
| **Moolre** | ✅ **Implemented** — sole live payment gateway |
| **Hubtel** | ❌ **Not implemented** — mentioned in `PROPOSAL.md` as future expansion only |
| **Paystack** | ❌ **Not implemented** — mentioned in `PROPOSAL.md` as future expansion only |

There are no Hubtel or Paystack routes, env variables, SDK imports, or callback handlers in runtime TypeScript/JavaScript code.

---

## Moolre architecture

```
Customer → /checkout → order created (REST or server)
       → /pay/[orderId]
       → POST /api/payment/moolre (initiate)
       → Moolre hosted payment UI
       → User completes payment
       ├─→ POST /api/payment/moolre/callback (server webhook)
       └─→ Redirect to /order-success
           → POST /api/payment/moolre/verify (client-triggered backup)
```

All server-side order reads/writes use `supabaseAdmin` (trusted DB access). Amounts are **never** taken from the client for initiation.

---

## Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/payment/moolre` | POST | Initiate payment; persist `moolre_externalref` in order metadata |
| `/api/payment/moolre/callback` | POST | Moolre server webhook on payment result |
| `/api/payment/moolre/verify` | POST | Post-redirect verification from order-success page |

### Required env vars

| Variable | Used by |
|----------|---------|
| `MOOLRE_API_USER` | Initiate, verify, callback status check |
| `MOOLRE_API_PUBKEY` | Initiate, verify, callback status check |
| `MOOLRE_ACCOUNT_NUMBER` | Initiate |
| `MOOLRE_MERCHANT_EMAIL` | Initiate (optional metadata) |
| `MOOLRE_CALLBACK_SECRET` | Callback secret validation |
| `NEXT_PUBLIC_APP_URL` | Return/callback URL construction |

---

## Initiate flow (`POST /api/payment/moolre`)

| Step | Behavior |
|------|----------|
| Rate limit | `RATE_LIMITS.payment` per client IP |
| Input | `orderId` (UUID or `order_number`); optional `customerEmail` (not used for amount) |
| Order load | `supabaseAdmin.from('orders')` — reject if missing or already `paid` |
| Amount | **`Number(order.total)` from DB only** — client amount ignored |
| External ref | `{order_number}-R{timestamp}` stored in metadata before Moolre call |
| Moolre API | `fetchWithTimeout` → Moolre embed/init endpoint |
| Response | Payment URL / embed payload to client |

Duplicate payment attempts get unique `-R{timestamp}` suffixes so Moolre does not collide with prior attempts.

---

## Callback flow (`POST /api/payment/moolre/callback`)

### Payload parsing

Accepts JSON, form-urlencoded, or raw text (JSON / querystring fallback). Moolre nests payment fields under `body.data` (`externalref`, `transactionid`, `amount`, `txstatus` / `txtstatus`).

### Authentication layers

| Condition | Action |
|-----------|--------|
| `body.secret` present and ≠ `MOOLRE_CALLBACK_SECRET` | **403** reject |
| `body.secret` matches `MOOLRE_CALLBACK_SECRET` | Trust signed callback; validate amount from payload |
| No `body.secret` | **Require** live verification via Moolre status API (`POST https://api.moolre.com/embed/status`) |
| `MOOLRE_CALLBACK_SECRET` unset | Warn in logs; unsigned path still requires status API |

### Success detection

Success when `(apiStatus === 1 OR txStatus === 1)` and no explicit failure signals in message or `txStatus` (0, -1, fail/cancel/declin/error).

### Amount validation

| Path | Validation |
|------|------------|
| Secret verified | Compare callback `amount` to `order.total` (±0.01) |
| Unsigned + status API | Compare Moolre API `data.amount` to `order.total` |
| Secret present but unverified config | Amount check on payload if amount present |

Mismatch → **400**, order not marked paid.

### Order update

1. Load order by `order_number` (strip `-R\d+` retry suffix from external ref)
2. If already `paid` → **200 idempotent** ("Order already processed")
3. Call RPC `mark_order_paid(order_ref, moolre_ref)`
4. Fire-and-forget `update_customer_stats` (errors logged, non-blocking)
5. Fire-and-forget `sendOrderConfirmation` — **does not block HTTP response**

### Failure path

Updates order `payment_status: 'failed'` and merges failure metadata (`moolre_reference`, `failure_reason`).

### Timeouts

Moolre status API call uses `fetchWithTimeout(..., 15_000)`.

---

## Verify flow (`POST /api/payment/moolre/verify`)

Called from `/order-success` after customer redirect.

| Step | Behavior |
|------|----------|
| Rate limit | Same bucket as payment |
| Input | `orderNumber` — must match `/^ORD-\d+-\d+$/` |
| Already paid | Return success immediately (idempotent) |
| Moolre check | Status API using `metadata.moolre_externalref` |
| Amount | Validated against `order.total` from status response |
| Mark paid | Same `mark_order_paid` RPC if not yet paid |
| Notifications | Order confirmation sent (blocking in verify path — acceptable for user-initiated request) |

**Security note:** `fromRedirect` or similar client flags are **not** trusted as proof of payment.

---

## Idempotency and duplicate protection

| Mechanism | Detail |
|-----------|--------|
| Already-paid short circuit | Callback and verify both return success without re-updating if `payment_status === 'paid'` |
| Unique external ref | Each initiate writes new `moolre_externalref` with timestamp suffix |
| RPC `mark_order_paid` | Should be internally safe for repeat calls (verify DB function behavior) |
| Initiate guard | Rejects initiate if order already `paid` |
| Rate limiting | Separate limits on payment, callback, verify endpoints |

---

## Guest order data access (payment pages)

Pre-fix, pay/success/tracking pages read orders via open `/rest/v1/orders`. Post-fix:

| Page | Data source |
|------|-------------|
| `/pay/[orderId]` | `GET /api/storefront/orders/public?ref=...` |
| `/order-success` | Public API + verify endpoint |
| `/order-tracking` | `POST /api/storefront/orders/lookup` (order_number + email) |

Public API returns limited fields; does not list all orders.

---

## Notifications on payment

| Channel | Provider | Timeout |
|---------|----------|---------|
| Email | Resend | Standard fetch |
| SMS | Moolre VAS API | `fetchWithTimeout` 10s |

Callback path: `void sendOrderConfirmation(...).catch(...)` — payment acknowledgment not delayed by SMS/email.

---

## Risk summary

| Risk | Mitigation (current code) |
|------|---------------------------|
| Forged callback | Secret validation + status API for unsigned |
| Amount tampering | DB-sourced initiate amount; callback amount checks |
| Replay / double mark | Idempotent paid check before RPC |
| Worker freeze on SMS | Non-blocking on callback; 10s SMS timeout |
| Missing `MOOLRE_CALLBACK_SECRET` | Unsigned callbacks require slower API verification; set secret in prod |
| Client-trusted payment proof | Verify endpoint uses Moolre API only |

---

## Manual verification steps

1. Confirm `MOOLRE_CALLBACK_SECRET` set in Coolify prod/staging
2. Place test order → complete Moolre payment → confirm callback logs and order `paid`
3. Replay callback for same order → expect idempotent success, no duplicate SMS storm
4. Send callback with wrong amount → expect 400, order stays unpaid
5. Confirm Hubtel/Paystack are **not** in env or routes unless newly implemented

---

## Related files

- `app/api/payment/moolre/route.ts`
- `app/api/payment/moolre/callback/route.ts`
- `app/api/payment/moolre/verify/route.ts`
- `lib/payments/fetch-with-timeout.ts`
- `lib/notifications.ts`
- `app/api/storefront/orders/public/route.ts`
- `PROPOSAL.md` (Hubtel/Paystack — proposal only)
