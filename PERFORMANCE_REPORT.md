# Performance Report

**Project:** Raymahomes  
**Date:** July 2026  
**Branch:** `staging/plain-postgres`

Measurements below are **baseline probes before this repair session**, unless noted. Post-fix timings require deploy and re-measurement.

---

## Baseline TTFB (production probes)

| Route | TTFB | Notes |
|-------|------|-------|
| `/checkout` | **~5.3s** | Slowest measured storefront page |
| `/` (home) | ~3.8–4.6s | Variable; likely SSR + multiple data fetches |
| `/shop` | ~1.2–1.3s | Best among key commerce pages |

Supporting checks (same probe window):

| Check | Result |
|-------|--------|
| Homepage | HTTP 200 |
| Shop | HTTP 200 |
| Storefront APIs | HTTP 200 |

---

## Identified freezing / latency causes

### 1. Blocking payment callback notifications

**Before:** Moolre callback handler awaited SMS and email (`sendOrderConfirmation`) before returning HTTP 200.

**Impact:** Slow or hung Moolre/Resend API calls could hold the Next.js worker, delaying webhook acknowledgment and increasing timeout risk from Moolre's side.

**Fix:** Callback now uses fire-and-forget:
```typescript
void sendOrderConfirmation(orderJson).catch(...)
```

### 2. Missing database query timeouts

**Before:** `pg` pool had no `connectionTimeoutMillis`, `statement_timeout`, or `query_timeout`.

**Impact:** Slow or stuck Postgres queries could exhaust pool connections and freeze request handlers indefinitely.

**Fix:** `lib/db/pool.ts` defaults:
| Setting | Default |
|---------|---------|
| `connectionTimeoutMillis` | 10s (`PG_CONNECT_TIMEOUT_MS`) |
| `statement_timeout` | 30s (`PG_STATEMENT_TIMEOUT_MS`) |
| `query_timeout` | 30s (`PG_QUERY_TIMEOUT_MS`) |

### 3. Unguarded external fetch (payments / SMS)

**Before:** Raw `fetch()` to Moolre and SMS endpoints without abort signals.

**Impact:** Network stalls block workers for the full platform timeout.

**Fix:** `lib/payments/fetch-with-timeout.ts` used by:
- Moolre payment initiate
- Moolre verify
- Moolre callback status check (15s)
- SMS send (10s)

### 4. Open REST scraping / enumeration risk

**Before:** Unauthenticated `GET /rest/v1/orders` and `/rest/v1/profiles` returned full datasets.

**Impact:** Not classic "slow page" latency, but high scrape volume could load DB and degrade all routes.

**Fix:** ACL denies unauthenticated list access; authenticated users scoped to own rows.

### 5. Checkout complexity (unresolved)

Checkout (~5.3s TTFB) likely combines:
- Multiple sequential server/component data loads
- Cart validation, shipping, coupon logic
- Possible N+1 embed queries via supabase-js
- Cold start on serverless/container spin-up (environment-dependent)

**Not fully profiled in this session** — requires post-deploy flamegraph or Next.js logging.

### 6. Home page variance (~3.8–4.6s)

Likely causes: banner/product/module fetches, unoptimized images (`images.unoptimized: true` trades build simplicity for larger payloads), and SSR of marketing content.

---

## Fixes applied (performance-related)

| Fix | File(s) | Expected effect |
|-----|---------|-----------------|
| Pool timeouts | `lib/db/pool.ts` | Fail fast; prevent connection pile-up |
| Fetch timeouts | `lib/payments/fetch-with-timeout.ts`, Moolre routes, `notifications.ts` | Bound external API wait |
| Non-blocking callback notifications | `app/api/payment/moolre/callback/route.ts` | Faster webhook response |
| REST ACL | `lib/db/rest-acl.ts`, REST routes | Reduce abusive full-table reads |
| Lazy admin client | `lib/supabase-admin.ts` | Faster/safer `next build` (CI), not runtime TTFB |
| Guest order APIs | `app/api/storefront/orders/public` | Targeted queries vs broad REST |

---

## Remaining recommendations

### P0 — After deploy

| Action | Why |
|--------|-----|
| Re-run TTFB probes on `/`, `/shop`, `/checkout` | Confirm baseline vs post-ACL/post-timeout |
| Monitor pool wait events / slow query logs | Validate 30s caps are appropriate |
| Watch Moolre callback duration in logs | Should drop after non-blocking notifications |

### P1 — Checkout optimization

| Action | Why |
|--------|-----|
| Profile `/checkout` server components | Identify sequential awaits |
| Consolidate storefront fetches | Single API or parallel `Promise.all` |
| Add caching for static CMS (`site_settings`, banners) | Reduce repeated DB hits on every checkout load |
| Review embed depth on order/cart queries | Avoid over-fetching joins |

### P1 — Home / shop

| Action | Why |
|--------|-----|
| Cache product listing queries (short TTL or ISR) | Shop is acceptable; home can improve |
| Lazy-load below-fold sections | Reduce initial SSR work |
| CDN for `STORAGE_PUBLIC_URL` assets | Disk-served images may lack edge cache |

### P2 — Observability

| Action | Why |
|--------|-----|
| Add request timing middleware or OpenTelemetry | Continuous TTFB tracking |
| Alert on p95 > 3s for `/checkout` | Early regression detection |
| Load test `/rest/v1/products` after ACL | Ensure catalog still scales |

---

## Environment tuning reference

From `.env.example`:

```env
PG_POOL_MAX=10
PG_CONNECT_TIMEOUT_MS=10000
PG_STATEMENT_TIMEOUT_MS=30000
PG_QUERY_TIMEOUT_MS=30000
```

Increase pool max only if Postgres `max_connections` and VPS memory allow. Decrease statement timeout if long-running admin reports should fail earlier.

---

## Expected outcomes post-deploy

| Area | Expectation |
|------|-------------|
| Moolre callbacks | Lower p95 response time; fewer worker stalls |
| DB under abuse | Failed queries timeout instead of hanging |
| Checkout TTFB | **May still be ~5s** until checkout-specific profiling |
| Shop / home | Modest improvement from reduced REST scrape load |

---

## Related documents

- `FULL_SYSTEM_AUDIT.md` — Security and architecture context
- `REPAIR_CHANGELOG.md` — Exact files changed
- `PAYMENT_AND_CALLBACK_AUDIT.md` — Callback timing details
