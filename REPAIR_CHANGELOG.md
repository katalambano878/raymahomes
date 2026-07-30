# Repair Changelog

**Session:** July 2026 security & stability hardening  
**Branch:** `staging/plain-postgres`  
**Database migrations:** None (ACL is application-layer)

---

## Summary

Fixed critical open-REST PII exposure, hardened Moolre payment callbacks, added guest order APIs, enforced storage write ACL, added pool/fetch timeouts, and resolved build/TypeScript failures. Package versions unchanged.

---

## Files changed

### New files

| File | Purpose |
|------|---------|
| `lib/db/rest-auth.ts` | Resolve REST actor from JWT, anon key, or service role key |
| `lib/db/rest-acl.ts` | Table/RPC/storage ACL replacing Supabase RLS on HTTP shims |
| `lib/payments/fetch-with-timeout.ts` | AbortSignal timeout wrapper for external APIs |
| `app/api/storefront/orders/public/route.ts` | Rate-limited guest order read by exact ref |
| `.env.example` | Documented env variable template |
| `FULL_SYSTEM_AUDIT.md` | This audit pack |
| `SUPABASE_TO_POSTGRES_MIGRATION_REPORT.md` | Migration feature matrix |
| `PAYMENT_AND_CALLBACK_AUDIT.md` | Moolre payment audit |
| `PERFORMANCE_REPORT.md` | Baseline timings and perf fixes |
| `REPAIR_CHANGELOG.md` | This file |

### Modified files

| File | Change |
|------|--------|
| `app/rest/v1/[table]/route.ts` | Gate all methods through `resolveRestActor` + `authorizeRestTable`; apply `forceEq` filters |
| `app/rest/v1/rpc/[fn]/route.ts` | Gate RPC through `authorizeRpc` |
| `app/storage/v1/object/[bucket]/[...path]/route.ts` | POST/DELETE require admin/staff; 15MB upload cap |
| `app/api/storefront/orders/lookup/route.ts` | Expanded guest lookup fields (order_number + email) |
| `app/(store)/pay/[orderId]/page.tsx` | Migrated from open REST to `/api/storefront/orders/public` |
| `app/(store)/order-success/page.tsx` | Migrated from open REST to public API + verify flow |
| `app/(store)/order-tracking/page.tsx` | Migrated from open REST to lookup API |
| `app/api/payment/moolre/route.ts` | `fetchWithTimeout`; DB-sourced amount; metadata external ref |
| `app/api/payment/moolre/verify/route.ts` | `fetchWithTimeout`; Moolre status API verification |
| `app/api/payment/moolre/callback/route.ts` | Secret validation, unsigned → status API, amount checks, non-blocking notifications |
| `lib/notifications.ts` | Uses `supabaseAdmin`; SMS via `fetchWithTimeout` (10s) |
| `lib/db/pool.ts` | `connectionTimeoutMillis`, `statement_timeout`, `query_timeout` |
| `lib/supabase-admin.ts` | Lazy Proxy init — fixes build without env at import time |
| `app/api/setup/create-admin/route.ts` | TypeScript fix (`u: any` → typed) |
| `app/(store)/account/invoice/[id]/page.tsx` | Prior session work (money/format fixes) |
| `app/error.tsx` | Error boundary improvements |
| `app/admin/error.tsx` | Admin error boundary improvements |
| `lib/format-money.ts` | Currency formatting helper |
| `docs/SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md` | Updated cutover/hardening notes |

---

## Bugs fixed

| ID | Severity | Description | Fix |
|----|----------|-------------|-----|
| SEC-001 | **Critical** | `GET /rest/v1/orders` exposed all orders without auth (prod + staging) | REST ACL + ownership filters |
| SEC-002 | **Critical** | `GET /rest/v1/profiles` exposed all profiles without auth | REST ACL + `forceEq: { id: userId }` |
| SEC-003 | High | Storage POST/DELETE unauthenticated | `authorizeStorageWrite` — admin/staff only |
| SEC-004 | High | Payment callback trusted unsigned payloads | Moolre status API verification path |
| SEC-005 | Medium | Callback amount not validated on all paths | Amount ±0.01 check vs `order.total` |
| PERF-001 | High | Callback blocked on SMS/email | Fire-and-forget notifications |
| PERF-002 | High | No DB query timeouts | Pool timeout settings |
| PERF-003 | Medium | Unguarded Moolre/SMS fetch | `fetchWithTimeout` |
| BUILD-001 | High | `next build` failed on missing `NEXT_PUBLIC_SUPABASE_URL` | Lazy `supabaseAdmin` Proxy |
| TS-001 | Low | `tsc` error in create-admin | Explicit typing |

---

## Features repaired (guest flows)

| Flow | Before | After |
|------|--------|-------|
| Pay page | Open REST order read | `/api/storefront/orders/public?ref=` |
| Order success | Open REST order read | Public API + `/api/payment/moolre/verify` |
| Order tracking | Open REST or broken ACL | `POST /api/storefront/orders/lookup` |

**Note:** Live prod/staging still run pre-deploy code until Coolify redeploy.

---

## Packages

**No changes** to `package.json` dependencies or devDependencies this session.

Key versions (unchanged):

| Package | Version |
|---------|---------|
| next | 15.1.11 |
| react | ^19.0.0 |
| pg | ^8.18.0 |
| @supabase/supabase-js | ^2.91.1 |
| jose | ^6.2.3 |
| bcryptjs | ^3.0.3 |

---

## Database

| Item | This session |
|------|--------------|
| SQL migrations | **None** |
| Schema changes | **None** |
| RLS policy changes | **None** |
| ACL | Application-layer only in Node |

Existing RPCs used: `mark_order_paid`, `update_customer_stats`, `upsert_customer_from_order`.

---

## Deploy verification (2026-07-30)

| Environment | Status |
|-------------|--------|
| Staging `raymahomes-staging` | ACL live — `/rest/v1/orders` → 403, products → 200, public order API → 404 for unknown ref |
| Production `raymahomes-app` | ACL live — `/rest/v1/orders` → 403 (`Authentication required to list orders`) |

Commit: `7f9df0f` on `staging/plain-postgres`

## Manual actions required

### Deploy

1. Commit and push `staging/plain-postgres` (when ready)
2. **Deploy staging first:** Coolify `raymahomes-staging` → https://raymahomes-staging.169-58-8-203.sslip.io
3. Smoke test:
   - `GET /rest/v1/orders` without JWT → expect 403
   - Guest pay flow with test order
   - Moolre test payment on staging
4. **Deploy production:** Coolify `raymahomes-app` → https://www.raymakitchenware.com

### Secrets & configuration

| Action | Reason |
|--------|--------|
| Set `MOOLRE_CALLBACK_SECRET` in Coolify | Signed callback validation |
| Verify `MOOLRE_API_USER`, `MOOLRE_API_PUBKEY`, `MOOLRE_ACCOUNT_NUMBER` | Payment initiate/verify |
| Confirm `CREATE_ADMIN_SECRET` is strong and not default | Admin bootstrap protection |
| Confirm `CRON_SECRET` set for payment reminders | Cron route auth |
| **Rotate keys if open REST was exploited** | `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, optionally `AUTH_JWT_SECRET` |
| Sync `.env.example` vars in Coolify | Pool timeouts, storage paths |

### Post-deploy verification

```bash
# ACL smoke (expect non-200 or empty error body for anon orders list)
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "apikey: $ANON_KEY" \
  "https://www.raymakitchenware.com/rest/v1/orders?select=id&limit=1"

# Public catalog still works
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://www.raymakitchenware.com/rest/v1/products?select=id&limit=1"

# Re-measure checkout TTFB
curl -s -o /dev/null -w "checkout TTFB: %{time_starttransfer}s\n" \
  "https://www.raymakitchenware.com/checkout"
```

---

## Not in scope

| Item | Status |
|------|--------|
| Hubtel integration | Not implemented — proposal only |
| Paystack integration | Not implemented — proposal only |
| Checkout SSR profiling | Recommended post-deploy |
| Automated ACL test suite | Recommended follow-up |
| Key rotation execution | Operator action — not performed in repo |

---

## Related documents

- `FULL_SYSTEM_AUDIT.md`
- `SUPABASE_TO_POSTGRES_MIGRATION_REPORT.md`
- `PAYMENT_AND_CALLBACK_AUDIT.md`
- `PERFORMANCE_REPORT.md`
- `docs/SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md`
