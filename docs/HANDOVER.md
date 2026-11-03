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

- Paid theme enforcement (monetization field exists; no billing wired).
- Push/email notifications for update availability (currently pull via `GET /v1/updates`;
  the `update-notifications` queue exists, processor returns an explicit
  not-implemented marker until a provider is wired).
- Theme publish pipeline: dependency scanning, automated responsive/a11y/perf tests.
- Multi-store switching in the storefront (v0 uses the merchant's first tenant).

## Done after handover (see git log)

- Critical bug fixes found by the end-to-end test (the app could not actually
  boot or log in before these):
  - `AuthModule` now exports `JwtModule` — `JwtAuthGuard` (an `APP_GUARD`)
    injects `JwtService`, which was invisible in `AppModule`'s scope, so
    `node dist/main.js` died with `UnknownDependenciesException` on boot.
  - `AuthService.toTokens()` is async but was spread without `await` in
    `register`/`login`/`refresh` — spreading a Promise yields `{}`, so
    login responses contained NO tokens at all.
- Storefront (`apps/storefront`, Next.js): merchant login (httpOnly cookie),
  dashboard (install list), and a sandboxed live preview —
  `GET /v1/customizer/installs/:id/preview` rendered to static HTML
  (zero `<script>` tags) and served through `<iframe sandbox="">` plus a
  `Content-Security-Policy: sandbox` header. Data-driven section renderers
  (hero-banner, product-rail) with graceful degradation for unknown section
  types; `javascript:` links sanitized; all text React-escaped. Verified by
  `verify-storefront.tsx` (25 checks incl. XSS attacks) and `verify-e2e.js`
  (full end-to-end: real API + real storefront, seeded over HTTP).

- Worker app (`apps/worker`): NestJS application context (no HTTP) reusing the
  API's DatabaseModule + UpdatesModule. Scheduled auto-apply every
  `AUTO_APPLY_INTERVAL_MS` (default 6h) via `UpdatesService.autoApplyAll()`
  (compatible-only, never force-updates). BullMQ queue topology
  (`update-notifications`, `preview-builds`) on Redis; processors start when
  `WORKER_QUEUES_ENABLED=true`. Verified by `verify-worker.js` (13 checks:
  real boot on PostgreSQL + Redis, auto-apply on empty DB, overlap guard,
  end-to-end job processing). Production: `deploy/docker-compose.yml` runs the
  worker after the API is healthy (the API owns migrations). Dockerfiles added
  for `apps/api` and `apps/worker` (+ `.dockerignore`); compose `build:`
  targets now actually work.
- Fixed: `UpdatesModule` now imports `TenantsModule` directly — its controller
  uses `@UseGuards(TenantGuard)` (injects `TenantsService`), so the module is
  valid standalone instead of relying on AppModule's flat imports.
- Production DB migrations: `apps/api/src/database/migrations/1793702244000-InitialSchema.ts`
  (all 11 tables). Production boots with `migrationsRun: true` and never
  synchronizes (`src/database/database.module.ts`). Verified by
  `verify-migrations.js` (116 checks: real up/down on PostgreSQL) and
  `verify-migration-schema.js` (schema-drift guard: entities == migration).
  CI runs both on every PR. New migrations: `npm run migration:generate`
  (from `apps/api`), hand-review before committing.
- CI pipeline: `.github/workflows/ci.yml` runs all `verify-*.js` scripts
  plus `npm audit` on every push/PR.
- Platform admin dashboard (`apps/storefront/app/admin`): platform_admin login
  (no tenant required — `loginAction` branches on the JWT roles claim) lands on
  `/admin`, guarded by `requireAdmin()` (API re-verifies the role per call).
  Stats (themes / published versions / stores), theme table with visibility
  toggle + per-theme publish-version form (manifest + config schema JSON,
  SDK-validated), create-theme form, one-click safe-update auto-apply
  (`POST /v1/admin/themes/updates/auto-apply`, compatible-only), and a
  cross-tenant store list (`GET /v1/admin/tenants` via new `PlatformController`;
  `TenantsService.listAll()`; `GET /v1/admin/themes/:id/versions` added).
  All mutations use `useActionState` server actions returning `{ok, message}`.
  Verified by `verify-admin.tsx` (29 checks: role helpers, form components,
  page wiring, API routes) — `npm run verify` now runs both suites
  (25 + 29 checks).
- Merchant product catalog (`apps/api/src/products/`): tenant-scoped CRUD
  (`GET/POST /v1/products`, `GET /v1/products/active?collection=`,
  `PATCH/DELETE /v1/products/:id`, `TenantGuard`), price in major units
  (default BDT), collections, active/hidden flag. New migration
  `1793790000000-AddProducts.ts` (schema-drift guard still green:
  entities == migration). `CustomizerService.getPreview()` now embeds active
  products, so product rails render real merchant data; `ProductRail`
  filters by collection, respects `limit`, shows ৳-formatted prices and
  gradient tiles (initial letter) for imageless products, `javascript:` image
  URLs blocked. Merchant dashboard (`/dashboard`) enriched: stats
  (products / collections / themes), product table (name, collection, price,
  status, delete), add-product form, theme cards — all mutations revalidate
  the page. Verified by `verify-products.js` (8 checks) + 6 new
  render/XSS checks in `verify-storefront.tsx` (now 30).

## Production notes

- Never boot with placeholder secrets (`main.ts` refuses in production).
- `synchronize: false` in production — migrations only.
- Backups: `deploy/backup.sh` via cron (see DEPLOYMENT.md).
- Logs contain no secrets by design; audit log records actions, not payloads.
