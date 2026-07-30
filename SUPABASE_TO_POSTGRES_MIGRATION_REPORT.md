# Supabase → Plain Postgres Migration Report

**Project:** Raymahomes (Rayma Kitchenware)  
**Shape:** A — shimmed `@supabase/supabase-js`  
**Branch:** `staging/plain-postgres`  
**Production:** https://www.raymakitchenware.com  
**Database:** `fleet-postgres` / `raymahomes`

---

## Migration overview

The app no longer calls `*.supabase.co` in production when the env cutover trio is set. The browser supabase-js client targets the **same Next.js origin** for `/rest/v1`, `/auth/v1`, and `/storage/v1`. Server code uses `DATABASE_URL` through `lib/db/supabase-compat.ts` backed by `lib/db/pool.ts`.

| Env variable | Purpose |
|--------------|---------|
| `DATABASE_URL` | Postgres connection string |
| `NEXT_PUBLIC_USE_PLAIN_PG` | `true` — enables shim mode |
| `NEXT_PUBLIC_SUPABASE_URL` | App origin (e.g. `https://www.raymakitchenware.com`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key for browser client |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role for server/admin |
| `AUTH_JWT_SECRET` | JWT signing for auth shim |
| `STORAGE_ROOT` / `STORAGE_PUBLIC_URL` | Local disk storage |

Full template: `.env.example`

---

## Feature matrix

| Supabase feature | Migration status | Raymahomes implementation |
|------------------|-------------------|---------------------------|
| **PostgREST queries** | ✅ Migrated | `app/rest/v1/[table]/route.ts` + `lib/db/supabase-compat.ts` |
| **Auth (GoTrue)** | ✅ Migrated | `app/auth/v1/[...path]/route.ts` + `lib/db/auth.ts` (bcrypt + jose) |
| **RLS** | ⚠️ Replaced | **App ACL** — `lib/db/rest-acl.ts` on HTTP shims only; in-process `supabaseAdmin` bypasses ACL |
| **Storage** | ✅ Migrated | Local disk — `lib/db/storage.ts`, `/storage/v1/object/*` routes |
| **Realtime** | ❌ Not used | No `.channel()` / subscription code in repo; feature removed / never ported |
| **RPC** | ✅ Migrated | `app/rest/v1/rpc/[fn]/route.ts` + Postgres functions |
| **Edge functions** | ✅ Ported | Next.js API routes under `app/api/*` |
| **Scheduled jobs** | ✅ Ported | `GET /api/cron/payment-reminders` (external cron + `CRON_SECRET`) |
| **Database triggers** | ✅ Retained | Existing Postgres triggers/RPCs (e.g. `mark_order_paid`) unchanged |
| **Supabase Dashboard** | ❌ N/A | Use `psql`, fleet CLI, or admin UI |
| **Hosted Supabase fallback** | ⚠️ Legacy path | `lib/supabase-admin.ts` can still use `@supabase/supabase-js` if `DATABASE_URL` unset |

---

## Queries (PostgREST compat)

| Aspect | Detail |
|--------|--------|
| Client API | Unchanged supabase-js `.from()`, `.select()`, filters, embeds |
| Wire protocol | HTTP to `/rest/v1/{table}` with PostgREST-style query params |
| Type parsing | `lib/db/pool.ts` — date/timestamp/numeric parsers match PostgREST JSON |
| Public read tables | `products`, `categories`, `product_images`, `product_variants`, `banners`, `store_modules`, `cms_content`, `site_settings`, `reviews`, `blog_posts`, `coupons` |
| Protected tables | `orders`, `profiles`, `support_tickets`, `customers`, `order_items` (direct list blocked) |
| Guest insert | `orders`, `order_items`, `contact_submissions`, `reviews` |

**Pre-migration gap:** Shim served all tables without ACL → **fixed** with `rest-auth` + `rest-acl`.

---

## Auth

| Supabase | Plain Postgres |
|----------|----------------|
| `auth.users` | Same table; passwords verified with bcrypt |
| JWT | Signed with `AUTH_JWT_SECRET` via `jose` |
| `app_metadata.role` | Loaded from `profiles.role` (`admin`, `staff`) |
| Session endpoints | `/auth/v1/token`, signup, user, logout via auth shim |
| Admin bootstrap | `POST /api/setup/create-admin` + `CREATE_ADMIN_SECRET` |

Browser sessions unchanged from app perspective (supabase-js auth client).

---

## RLS → ACL mapping

Supabase RLS policies are **not evaluated** by the in-app PostgREST shim. Access control is enforced in Node before queries run.

| Concern | Supabase (before) | Shape A (after Jul 2026 hardening) |
|---------|-------------------|-------------------------------------|
| List all orders | Blocked by RLS for anon | **Was open** → now 403 without auth; authenticated filtered by `user_id` |
| Read own profile | RLS `auth.uid()` | `forceEq: { id: userId }` |
| Staff/admin | RLS bypass via role | `isStaff` / `service_role` full access |
| Storage upload | RLS on `storage.objects` | `authorizeStorageWrite` — admin/staff only |
| RPC `mark_order_paid` | Staff only | `STAFF_RPC` set — denied to anon/authenticated |

In-process server code using `supabaseAdmin` remains full-trust (equivalent to service role).

---

## Storage

| Operation | Route | Access |
|-----------|-------|--------|
| Public read | `/storage/v1/object/public/{bucket}/{path}` | Public |
| Signed URL | `/storage/v1/object/sign/{bucket}/{path}` | Token-based |
| Upload | `POST /storage/v1/object/{bucket}/{path}` | Admin/staff; max **15MB** |
| Delete | `DELETE /storage/v1/object/{bucket}/{path}` | Admin/staff |

Files stored under `STORAGE_ROOT` on VPS (not Supabase Storage).

---

## Realtime

| Item | Status |
|------|--------|
| Supabase Realtime subscriptions | **Not implemented** in this codebase |
| Admin live order updates | Polling / manual refresh |
| Migration action | None required — no Realtime channels to port |

---

## RPC functions

| RPC | Public | Staff/service |
|-----|--------|---------------|
| `upsert_customer_from_order` | ✅ | ✅ |
| `mark_order_paid` | ❌ | ✅ |
| `update_customer_stats` | ❌ | ✅ |
| `reduce_stock_on_order` | ❌ | ✅ |
| `get_all_customer_emails` | ❌ | ✅ |
| `get_all_customer_phones` | ❌ | ✅ |
| `is_admin_or_staff` | ❌ | ✅ |

Enforced in `authorizeRpc()` at `app/rest/v1/rpc/[fn]/route.ts`.

---

## Edge functions → API routes

| Former edge concern | Current route |
|---------------------|---------------|
| Payment initiate | `POST /api/payment/moolre` |
| Payment callback | `POST /api/payment/moolre/callback` |
| Payment verify | `POST /api/payment/moolre/verify` |
| Storefront aggregates | `app/api/storefront/*` |
| Payment reminders cron | `GET /api/cron/payment-reminders` |
| Notifications | `lib/notifications.ts` (called from API/callback) |
| reCAPTCHA | `POST /api/recaptcha/verify` |

---

## Scheduled jobs

| Job | Trigger | Auth | Purpose |
|-----|---------|------|---------|
| Payment reminders | External cron → `GET /api/cron/payment-reminders` | `Authorization: Bearer ${CRON_SECRET}` | Email/SMS for unpaid orders >15 min |

No Supabase `pg_cron` or Edge Function schedulers in use post-migration.

---

## Build & deploy notes

| Issue | Resolution |
|-------|------------|
| Build failed without `NEXT_PUBLIC_SUPABASE_URL` | Lazy `supabaseAdmin` Proxy |
| `images.unoptimized: true` | Local/storage URLs — no `*.supabase.co` remotePatterns |
| Service worker | `sw-v2.5-rayma` (migration-safe) |
| Coolify prod app | `raymahomes-app` |
| Coolify staging app | `raymahomes-staging` |

---

## Verification checklist (post-deploy)

```bash
BASE=https://www.raymakitchenware.com

# Public catalog still works
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/rest/v1/products?select=id&limit=1"

# ACL: must NOT return 200 with data for unauthenticated orders
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "apikey: $ANON_KEY" "$BASE/rest/v1/orders?select=id&limit=1"

# Guest order API (exact ref only)
curl -s "$BASE/api/storefront/orders/public?ref=ORD-..." 

# Auth shim
curl -s -X POST "$BASE/auth/v1/token?grant_type=password" ...
```

---

## Outstanding migration work

| Item | Priority |
|------|----------|
| Deploy ACL + guest APIs to staging/prod | **P0** |
| Rotate keys if open REST was exploited | **P0** |
| Automated ACL regression tests | P1 |
| Document RPC/trigger inventory in SQL | P2 |
| Hubtel / Paystack | **Not started** — proposal only |

See also: `docs/SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md`, `FULL_SYSTEM_AUDIT.md`.
