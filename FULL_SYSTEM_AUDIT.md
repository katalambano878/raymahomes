# Raymahomes — Full System Audit

**Date:** July 2026  
**Branch:** `staging/plain-postgres`  
**Production:** https://www.raymakitchenware.com (Coolify `raymahomes-app`)  
**Staging:** https://raymahomes-staging.169-58-8-203.sslip.io (Coolify `raymahomes-staging`)  
**Database:** `fleet-postgres` / `raymahomes` (~39 products)

---

## Executive summary

Raymahomes is a Next.js 15 e-commerce store migrated from hosted Supabase to **Shape A plain Postgres** (in-app REST/auth/storage shims + `pg` pool). Storefront and admin UIs were largely functional before this audit, but the HTTP `/rest/v1` shim had **no application-level access control**, exposing customer PII on production and staging. Payment processing uses **Moolre only**; Hubtel and Paystack appear in `PROPOSAL.md` as future options and are **not implemented**. This session added ACL enforcement, guest-order APIs, payment hardening, pool timeouts, and build fixes. **Deploy to staging then prod is required** for fixes to take effect in live environments.

---

## Baseline (before repairs)

Probe results captured **before** ACL and guest-order API work:

| Check | Result |
|-------|--------|
| Homepage, shop, storefront APIs | HTTP 200 |
| `GET /rest/v1/products` (unauthenticated) | HTTP 200 — expected (public catalog) |
| `GET /rest/v1/orders` (unauthenticated) | **HTTP 200 — CRITICAL PII leak** (prod + staging) |
| `GET /rest/v1/profiles` (unauthenticated) | **HTTP 200 — CRITICAL PII leak** (prod + staging) |
| Checkout TTFB | ~5.3s |
| Shop TTFB | ~1.2–1.3s |
| Home TTFB | ~3.8–4.6s |
| `tsc` | 1 error in `create-admin` (`u: any`) |
| `next build` | Failed: `Missing NEXT_PUBLIC_SUPABASE_URL` at `supabaseAdmin` import |
| Prior uncommitted work | Invoice page, error boundaries, `format-money`, migration guide |

---

## Architecture summary

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 App Router, React 19, TypeScript |
| Migration shape | **Shape A** — browser `@supabase/supabase-js` → app `/rest/v1`, `/auth/v1`, `/storage/v1` |
| Server DB | `DATABASE_URL` via `pg` pool (`lib/db/pool.ts`) + `lib/db/supabase-compat.ts` |
| Auth | `lib/db/auth.ts` — bcrypt passwords, `jose` JWT against `auth.users` |
| HTTP ACL | `lib/db/rest-auth.ts` + `lib/db/rest-acl.ts` (replaces Supabase RLS on shims) |
| Admin client | `lib/supabase-admin.ts` — lazy Proxy; in-process compat when `DATABASE_URL` set |
| Storage | Local disk via `STORAGE_ROOT` / `STORAGE_PUBLIC_URL` |
| Email | Resend (`lib/notifications.ts`) |
| SMS | Moolre VAS API (`lib/notifications.ts`) |
| Payments | **Moolre only** (`app/api/payment/moolre/*`) |

Env cutover trio (see `docs/SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md`): `DATABASE_URL`, `NEXT_PUBLIC_USE_PLAIN_PG=true`, `NEXT_PUBLIC_SUPABASE_URL` = app origin.

---

## Route inventory summary

### Storefront pages (~35) — public HTTP 200 on prod

| Area | Routes |
|------|--------|
| Catalog | `/`, `/shop`, `/categories`, `/product/[slug]`, `/cart`, `/wishlist`, `/checkout` |
| Content | `/about`, `/contact`, `/blog`, `/blog/[id]`, `/faqs`, `/terms`, `/privacy`, `/shipping`, `/help`, `/help/article/[id]` |
| Account | `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/account`, `/account/invoice/[id]`, `/account/verify-email`, `/account/verify-phone`, `/account/privacy` |
| Orders (guest) | `/pay/[orderId]`, `/order-success`, `/order-tracking`, `/returns`, `/returns/confirmation` |
| Support | `/support/ticket`, `/support/tickets` |
| PWA / misc | `/pwa-settings`, `/offline`, `/maintenance` |

Guest order pages were repaired in code (migrated off open REST); **pending deploy** for ACL to be live.

### Admin pages (~20) — require login

| Area | Routes |
|------|--------|
| Core | `/admin`, `/admin/login` |
| Commerce | `/admin/orders`, `/admin/orders/[id]`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]`, `/admin/pos`, `/admin/inventory`, `/admin/coupons` |
| CRM / content | `/admin/customers`, `/admin/customers/[id]`, `/admin/categories`, `/admin/reviews`, `/admin/blog`, `/admin/customer-insights` |
| Ops | `/admin/analytics`, `/admin/notifications`, `/admin/modules`, `/admin/test-sms` |

### API routes (15)

| Route | Purpose |
|-------|---------|
| `POST /api/payment/moolre` | Initiate Moolre payment |
| `POST /api/payment/moolre/verify` | Post-redirect verification |
| `POST /api/payment/moolre/callback` | Moolre webhook |
| `GET /api/storefront/orders/public` | Limited guest order payload (pay/success) |
| `POST /api/storefront/orders/lookup` | Guest tracking (order_number + email) |
| `GET /api/storefront/products` | Storefront product feed |
| `GET /api/storefront/categories` | Categories |
| `GET /api/storefront/banners` | Banners |
| `GET /api/storefront/value-props` | Value props |
| `GET /api/storefront/reviews` | Reviews |
| `POST /api/storefront/support-tickets` | Support ticket creation |
| `POST /api/setup/create-admin` | One-time admin bootstrap |
| `GET /api/cron/payment-reminders` | Unpaid-order reminders (CRON_SECRET) |
| `POST /api/recaptcha/verify` | reCAPTCHA |
| `POST /api/notifications` | Notification trigger |

### Compatibility shims

| Shim | Handler |
|------|---------|
| `/rest/v1/[table]` | PostgREST-style CRUD + **ACL** |
| `/rest/v1/rpc/[fn]` | RPC + **ACL** |
| `/auth/v1/[...path]` | GoTrue-compatible auth |
| `/storage/v1/object/public/...` | Public file read |
| `/storage/v1/object/sign/...` | Signed URLs |
| `/storage/v1/object/[bucket]/...` | Upload/delete (**admin/staff only**, 15MB cap) |

---

## Database architecture

- **Engine:** PostgreSQL on VPS (`fleet-postgres`), database `raymahomes`
- **Access:** Server-side only via `pg` pool; browser uses supabase-js against app shims
- **Schema:** Supabase-origin tables (`auth.users`, `profiles`, `orders`, `products`, etc.) with RPCs such as `mark_order_paid`, `upsert_customer_from_order`
- **RLS:** Postgres RLS policies may exist from Supabase era; **HTTP shim access is governed by app ACL**, not RLS. In-process `supabaseAdmin` bypasses ACL (server-trusted)
- **Migrations this session:** None — ACL is application-layer only

---

## Auth

| Component | Detail |
|-----------|--------|
| Password hashing | bcrypt (`lib/db/auth.ts`) |
| Tokens | `jose` SignJWT / jwtVerify; 7-day access, 30-day refresh |
| Roles | `profiles.role` → `admin`, `staff`, or default authenticated |
| REST actor resolution | `resolveRestActor()` — service role key, JWT, or anon |
| Shim enforcement | `authorizeRestTable`, `authorizeRpc`, `authorizeStorageWrite` |

Ownership filters (`forceEq`) on GET: `profiles.id`, `orders.user_id`, `support_tickets.user_id`.

---

## Payments

**Implemented:** Moolre mobile money only (`/api/payment/moolre`, `/verify`, `/callback`).

**Not implemented:** Hubtel, Paystack — mentioned in `PROPOSAL.md` only; no routes, env vars, or SDK usage in runtime code.

See `PAYMENT_AND_CALLBACK_AUDIT.md` for flow detail.

---

## SMS

- Provider: **Moolre** (`https://api.moolre.com/open/sms/send`)
- Config: `MOOLRE_SMS_API_KEY` or `MOOLRE_API_KEY`, `MOOLRE_SMS_SENDER_ID`, `ADMIN_SMS_NUMBERS`
- Implementation: `lib/notifications.ts` → `sendSMS()` with `fetchWithTimeout` (10s)
- Used for: order confirmation, shipping updates, welcome, admin new-order alerts, payment reminders

---

## Performance findings (baseline)

| Page | TTFB (baseline) |
|------|-----------------|
| Home | ~3.8–4.6s |
| Shop | ~1.2–1.3s |
| Checkout | ~5.3s |

Contributing factors identified: heavy server rendering, unbounded DB queries (no pool timeouts pre-fix), blocking notification work on payment callbacks, and risk of REST scraping load on open endpoints.

See `PERFORMANCE_REPORT.md` for fixes and recommendations.

---

## Security findings

### Critical (pre-fix)

1. **Open REST PII** — Unauthenticated `GET /rest/v1/orders` and `/rest/v1/profiles` returned full rows on prod and staging
2. **Guest flows depended on open REST** — Pay, order-success, and order-tracking pages queried orders via anon REST client
3. **Storage writes** — Upload/delete on storage shim lacked role checks before this session
4. **Key exposure risk** — If anon/service keys were used while REST was open, data was enumerable without JWT

### High (partially addressed in code)

- Payment callbacks without secret relied on payload trust (now requires Moolre status API for unsigned callbacks)
- Callback notifications blocked response (now fire-and-forget)
- Missing DB query timeouts could freeze workers under slow queries

### Medium / ongoing

- Public catalog tables intentionally readable via REST (`products`, `reviews`, etc.)
- `CREATE_ADMIN_SECRET` and `MOOLRE_CALLBACK_SECRET` must be strong and set in Coolify
- Rotate `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` if previously exposed via open REST
- CORS on REST shim is `*` — acceptable for supabase-js compat but increases cross-origin read of public tables

---

## Supabase migration findings

| Area | Status |
|------|--------|
| Data plane | Migrated to `pg` + compat client |
| Auth | Self-hosted GoTrue shim |
| Storage | Local disk shim |
| Realtime | **None** — no `.channel()` usage in codebase |
| Edge functions | Ported to Next.js API routes / RPC |
| RLS | Replaced by **app ACL** on HTTP shims only |
| Build | Fixed lazy `supabaseAdmin` init for env-less builds |

See `SUPABASE_TO_POSTGRES_MIGRATION_REPORT.md` for feature matrix.

---

## Broken / at-risk features (pre-fix)

| Feature | Issue | Status |
|---------|-------|--------|
| Guest pay / success / tracking | Used open REST for order reads | **Fixed in code** — uses `/api/storefront/orders/public` and lookup API |
| Order history (authenticated) | Relied on REST with broken ACL | **Fixed** — REST now requires auth + `user_id` filter |
| Admin product uploads | Storage POST unauthenticated | **Fixed** — admin/staff only |
| `next build` in CI | Eager `supabaseAdmin` env check | **Fixed** — lazy Proxy |
| TypeScript | `create-admin` implicit any | **Fixed** |

---

## Root causes

1. **Shape A gap:** PostgREST shim implemented CRUD without porting Supabase RLS semantics to application code
2. **Dual client paths:** Server `supabaseAdmin` was secure; browser anon client hit the same tables with no gate
3. **Guest UX shortcut:** Pay/tracking pages used supabase-js `.from('orders')` instead of dedicated scoped APIs
4. **Operational:** Pool and fetch calls lacked timeouts; callbacks awaited SMS/email

---

## Fixes applied (this session)

1. **`lib/db/rest-auth.ts` + `lib/db/rest-acl.ts`** — Role resolution and table/RPC/storage ACL
2. **`app/rest/v1/[table]/route.ts` + `rpc/[fn]/route.ts`** — Enforce ACL; `forceEq` for profiles/orders/support_tickets
3. **`app/storage/v1/object/[bucket]/[...path]/route.ts`** — POST/DELETE require admin/staff; 15MB limit
4. **`app/api/storefront/orders/public/route.ts`** — Rate-limited guest order read by exact ref
5. **`app/api/storefront/orders/lookup/route.ts`** — Expanded guest lookup (order_number + email)
6. **Pay / order-success / order-tracking pages** — Migrated off open REST
7. **`lib/notifications.ts`** — Uses `supabaseAdmin`; SMS `fetchWithTimeout` 10s
8. **Moolre initiate/verify/callback** — `fetchWithTimeout`; unsigned callbacks verified via Moolre status API; non-blocking notifications on callback
9. **`lib/db/pool.ts`** — `connectionTimeoutMillis`, `statement_timeout`, `query_timeout`
10. **`lib/supabase-admin.ts`** — Lazy init Proxy
11. **`.env.example`** — Documented required variables
12. **`app/api/setup/create-admin/route.ts`** — TypeScript fix

---

## Remaining risks

| Risk | Mitigation |
|------|------------|
| Fixes not deployed | Deploy `staging/plain-postgres` → staging → prod |
| Keys previously scraped | Rotate anon/service keys and audit access logs |
| Checkout still slow | Re-measure TTFB post-deploy; profile queries and SSR |
| `MOOLRE_CALLBACK_SECRET` unset | Set in Coolify; unsigned callbacks use slower API verification path |
| No automated ACL regression tests | Add smoke tests for `/rest/v1/orders` → 403 without auth |
| Hubtel/Paystack requested | Requires new implementation — not present today |

---

## Related documents

- `SUPABASE_TO_POSTGRES_MIGRATION_REPORT.md` — Migration feature matrix
- `PAYMENT_AND_CALLBACK_AUDIT.md` — Moolre-only payment audit
- `PERFORMANCE_REPORT.md` — Timings and optimization notes
- `REPAIR_CHANGELOG.md` — File-level change log
- `docs/SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md` — Deploy/env playbook
