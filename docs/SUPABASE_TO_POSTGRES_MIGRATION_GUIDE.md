# Raymahomes — Supabase → plain Postgres cutover

**Shape:** A — shimmed `@supabase/supabase-js` → app `/rest/v1`, `/auth/v1`, `/storage/v1` + `DATABASE_URL`  
**Repo:** `katalambano878/raymahomes`  
**Branch:** `staging/plain-postgres`  
**Coolify prod:** `raymahomes-app` (`f7kc2ot1qsdat3b2tx5f74hk`)  
**Coolify staging:** `raymahomes-staging` (`j12u03z29h7151rfmmnh7hdu`)  
**Production:** https://www.raymakitchenware.com  
**DB:** `fleet-postgres` / `raymahomes`

See also: store hardening playbook in the big-vps workspace (`STORE_HARDENING_PLAYBOOK.md`).

## Env cutover trio (set together in Coolify)

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | `postgresql://…@fleet-postgres:5432/raymahomes` |
| `NEXT_PUBLIC_USE_PLAIN_PG` | `true` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://www.raymakitchenware.com` (app origin, not `*.supabase.co`) |

Also usually required: JWT secrets, `NEXT_PUBLIC_APP_URL`, `STORAGE_ROOT` / `STORAGE_PUBLIC_URL`, Resend + payment keys.

## Hardening notes (Jul 2026)

- [x] `images.unoptimized: true`; drop `*.supabase.co` / `via.placeholder.com` remotePatterns
- [x] Service worker `sw-v2.5-rayma` (§16-safe)
- [x] `lib/format-money.ts` + admin/storefront money paths
- [x] `app/error.tsx` + `app/admin/error.tsx`
- [x] Storefront/cron APIs → `supabaseAdmin`
- [x] Order history: Track / Reorder / Invoice / Help; hide Bulk Restock stub

## Verify

```bash
BASE=https://www.raymakitchenware.com
ssh big-vps "sudo docker ps --format '{{.Image}} {{.Status}}' | grep f7kc2ot"
git rev-parse --short HEAD
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/"
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/shop"
curl -s "$BASE/service-worker.js" | head -n 3
```
