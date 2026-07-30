import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * Limited public order payload for pay / success pages.
 * Does not list orders — requires an exact order id or order_number.
 */
export async function GET(request: Request) {
  try {
    const clientId = getClientIdentifier(request);
    const rl = checkRateLimit(`order-public:${clientId}`, {
      maxRequests: 30,
      windowSeconds: 60,
    });
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const ref = (searchParams.get("ref") || searchParams.get("order") || "").trim();
    const includeItems = searchParams.get("items") === "1";

    if (!ref || ref.length > 80) {
      return NextResponse.json({ error: "Missing order reference" }, { status: 400 });
    }

    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);

    const select = includeItems
      ? `id, order_number, email, phone, status, payment_status, total, subtotal, shipping_total, tax_total, discount_total, currency, shipping_address, metadata, created_at, order_items (id, product_name, variant_name, quantity, unit_price, total_price, metadata)`
      : `id, order_number, email, phone, status, payment_status, total, subtotal, shipping_total, tax_total, discount_total, currency, shipping_address, metadata, created_at`;

    const q = supabaseAdmin.from("orders").select(select);
    const { data: order, error } = await (
      isUUID ? q.eq("id", ref) : q.eq("order_number", ref)
    ).maybeSingle();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[orders/public]", message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
