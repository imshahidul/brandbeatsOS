# QA Checklist — Theme Marketplace module

## 1. Automated verification (all passing, 2026-11-03)

Run from `apps/api` (and `packages/theme-sdk` for the SDK):

| Script | What it proves | Checks |
|---|---|---|
| `verify-phase1.js` | argon2id hashing, JWT sign/verify, JwtAuthGuard (401 paths), RolesGuard (403 paths), TenantGuard isolation, DTO validation | 14 ✅ |
| `verify-themes.js` | Theme registry: slug rules, SDK-validated publishing, version immutability | 9 ✅ |
| `verify-marketplace.js` | Browse/filter, install latest, tenant isolation, switch/uninstall, private-theme hiding | 9 ✅ |
| `verify-customizer.js` | Settings/sections validation, maxInstances, publish snapshots, preview assembly | 8 ✅ |
| `verify-updates.js` | Update detection, compatibility reports, staging, blocked applies, rollback, auto-apply safety | 10 ✅ |
| `packages/theme-sdk/verify.js` | Manifest validation, rejection paths, settings validation, helpers | 9 ✅ |

**Total: 59 automated checks, all passing** (Phases 0–6), **+ 116 migration checks**
(`verify-migrations.js`: real up/down on PostgreSQL), **+ schema-drift guard**
(`verify-migration-schema.js`: entities == migration), **+ 13 worker checks**
(`verify-worker.js`: real boot on PostgreSQL + Redis, auto-apply, BullMQ
end-to-end), **+ 25 storefront checks** (`verify-storefront.tsx`: render,
sandboxing, XSS), **+ 25 end-to-end checks** (`verify-e2e.js`: real API +
storefront over HTTP). **Grand total: 239 automated checks.**
Full clean `tsc` build + `nest build` + `next build`.

## 2. Acceptance criteria (spec §16) — honest mapping

| # | Criterion | Status |
|---|---|---|
| 1 | Merchants browse and preview published themes | ✅ API complete (browse + preview document). Sandboxed renderer UI is frontend work (backlog). |
| 2 | Install and switch themes | ✅ |
| 3 | Customize without coding | ✅ API complete; visual editor UI consumes `configSchema` (frontend backlog). |
| 4 | Publish customized storefront | ✅ immutable snapshots |
| 5 | Admins publish new themes | ✅ |
| 6 | New themes appear without redeploy | ✅ DB-driven |
| 7 | Version history | ✅ |
| 8 | Update notifications | ✅ |
| 9 | Updates preserve compatible customizations | ✅ |
| 10 | Incompatible updates detected | ✅ |
| 11 | Preview updates before publishing | ✅ staging + compatibility report |
| 12 | Roll back to previous version | ✅ |
| 13 | Published storefronts never change unexpectedly | ✅ only snapshots render; updates need approval or compatible auto |
| 14 | Security & quality checks on theme packages | ⚠️ SDK validation ✅. Dependency scanning + automated responsive/a11y/perf tests belong in the publish pipeline worker (backlog). |
| 15 | Consistent rendering across devices | API-ready (device-agnostic documents); renderer frontend pending. |

## 3. Integration tests (require VPS with Docker — run before launch)

```bash
# on the VPS, after deploy:
export BASE=https://your-domain/v1

# register + login
curl -s -X POST $BASE/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"shop@example.com","password":"test-password-123"}' | tee /tmp/reg.json
TOKEN=$(node -e "console.log(JSON.parse(require('fs').readFileSync('/tmp/reg.json')).accessToken)")
TENANT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('/tmp/reg.json')).tenant.id)")

# auth guard
curl -s $BASE/auth/me | grep -q 401 && echo "unauth blocked OK"
curl -s $BASE/auth/me -H "Authorization: Bearer $TOKEN" | grep -q shop@example.com && echo "me OK"

# tenant isolation: call with a bogus tenant header → 403
curl -s $BASE/marketplace/installs -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000000" | grep -q 403 && echo "isolation OK"

# rate limiting: 6 rapid logins → 6th is 429
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST $BASE/auth/login \
    -H 'Content-Type: application/json' -d '{"email":"x@y.z","password":"wrong"}'
done
```

Also verify: Postgres data persists across `docker compose restart db`;
`audit_log` rows appear for mutating calls; nightly backup script runs.

## 4. Security re-checks before launch

- [ ] `.env` on VPS has real secrets (boot refuses placeholders in production).
- [ ] `NODE_ENV=production` → TypeORM `synchronize` is OFF (verify in logs).
- [ ] Caddy serves valid TLS; HSTS header present (helmet).
- [ ] SSH key-only, firewall 80/443/22 (see DEPLOYMENT.md).
- [ ] `npm audit` clean on deploy day.
