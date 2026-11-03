# Handover — for developers joining after launch

Welcome! This backend was built A-to-Z in 6 phases. Everything below is
verifiable: docs describe what the code does, and `verify-*.js` scripts
prove it.

## Repo tour

```
apps/api/src/
  auth/         register/login/refresh/logout (argon2id, rotating refresh tokens)
  users/        user entity + service (password hash never leaves the service)
  tenants/      workspaces, memberships, white-label branding (logo/favicon/name)
  themes/       theme registry + immutable version publishing (SDK-validated)
  marketplace/  browse/search/filter, install/switch/uninstall (tenant-isolated)
  admin/        platform_admin: theme releases, visibility, auto-apply updates
  customizer/   draft settings + homepage-builder sections + publish snapshots
  updates/      update notifications, compatibility checks, staging, apply, rollback
  common/       JwtAuthGuard (global), RolesGuard (global), TenantGuard, AuditInterceptor
packages/theme-sdk/   theme.json schema, settings/section validators, schema diff
themes/starter-fashion/  sample theme proving the contract
deploy/         docker-compose.yml (single VPS), Caddyfile, backup.sh
docs/           ARCHITECTURE, SECURITY, API, DEPLOYMENT, QA_CHECKLIST, THEME_FRAMEWORK
```

## Run it

```bash
npm install
docker compose -f deploy/docker-compose.yml up -d db redis  # local infra
npm run dev --workspace=apps/api
node apps/api/verify-*.js   # 50 checks, must all pass before any PR merges
node packages/theme-sdk/verify.js
```

## Conventions (follow these — they're load-bearing)

1. **Guards, not if-statements.** Auth is global (`JwtAuthGuard` + `@Public()` opt-out).
   RBAC via `@Roles(...)`. Tenant isolation via `TenantGuard` + `X-Tenant-Id`,
   and `tenantId` inside every repository `where` clause.
2. **New feature = new module.** Never bolt unrelated logic onto an existing
   service. Wire the module in `app.module.ts`.
3. **API versioning:** breaking change → `/v2`, keep `/v1` working.
4. **Validation at the boundary:** DTOs (class-validator) on every input;
   SDK validators for anything theme-shaped.
5. **Merchant data is never silently dropped.** Updates migrate or block with
   a report; backups are immutable snapshots.
6. **Docs match code.** If you change behavior, update `docs/API.md` in the
   same PR. The QA checklist maps spec acceptance criteria honestly —
   keep it honest.

## How to do common tasks

- **Add an endpoint:** DTO in `dto/`, method on the service (with a check in the
  matching `verify-*.js`), route on the controller, document in `docs/API.md`.
- **Publish a theme (admin):** `POST /v1/admin/themes` → `POST
  /v1/admin/themes/:id/versions` (manifest validated by SDK) → `PATCH
  /v1/admin/themes/:id` `{"visibility":"public"}`.
- **Add a customizable theme property:** extend the theme's
  `config.schema.json` → publish a new theme version. No platform code changes.
- **Run auto-updates:** `POST /v1/admin/updates/auto-apply` (or cron it later).

## Honest backlog (not done yet)

- `apps/worker` (BullMQ): preview builds, notification delivery, scheduled auto-apply.
- Storefront renderer + merchant dashboard frontend (Next.js) consuming the
  preview/published documents; sandboxed iframe renderer.
- Paid theme enforcement (monetization field exists; no billing wired).
- Push/email notifications for update availability (currently pull via `GET /v1/updates`).
- Production DB migrations (dev uses `synchronize`; prod must use migrations).
- Theme publish pipeline: dependency scanning, automated responsive/a11y/perf tests.
- CI pipeline running all `verify-*.js` scripts on every PR.

## Production notes

- Never boot with placeholder secrets (`main.ts` refuses in production).
- `synchronize: false` in production — migrations only.
- Backups: `deploy/backup.sh` via cron (see DEPLOYMENT.md).
- Logs contain no secrets by design; audit log records actions, not payloads.
