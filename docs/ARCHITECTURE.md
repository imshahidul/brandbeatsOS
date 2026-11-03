# Architecture — Theme Marketplace & Storefront Ecosystem

## 1. Goals

- Merchants browse/preview/install/switch/customize/publish themes with zero code.
- Brand Beats admins release themes independently (no app redeploy).
- Theme updates never silently overwrite merchant content (safe update + rollback).
- **Change-tolerance:** new requirements arrive any time; the codebase must absorb them without rewrites.

## 2. How we stay change-tolerant

1. **Module boundaries (NestJS modules).** Each domain is a module with its own
   controllers/services/repositories: `auth`, `tenants`, `themes`, `marketplace`,
   `customizer`, `versions`, `previews`, `billing` (stub for paid themes later).
   New feature = new module or new endpoint, never a rewrite.
2. **Versioned public API.** All routes under `/v1/...`. Breaking changes go to
   `/v2/...`; `/v1` keeps working. Documented in `docs/API.md`.
3. **Config-driven themes, not code-driven.** Themes declare a `theme.json`
   manifest + JSON-Schema `config.schema.json`. The platform renders from the
   schema. Adding a new section type or setting = schema change, not code change.
4. **Strict separation (spec §10):**
   - `theme_packages` (immutable, versioned artifacts)
   - `merchant_theme_settings` (merchant overrides, migrated on update)
   - `published_snapshots` (point-in-time rollback targets)
   Theme updates migrate settings via versioned schemas; incompatible settings
   are flagged for merchant action, never deleted.
5. **Ports & adapters for infra.** Storage (S3-compatible), queue (BullMQ/Redis),
   and DB access go through interfaces, so a small VPS today can become managed
   services tomorrow with no business-logic changes.

## 3. Data model (core tables)

- `tenants` — merchant workspaces (multi-tenant isolation by `tenant_id` everywhere).
  Carries white-label branding (`name`, `logo_url`, `favicon_url`) that survives
  theme switches; per-theme brand identity (colors, fonts) lives in
  `merchant_theme_settings` instead.
- `users`, `roles` — RBAC: `merchant`, `merchant_admin`, `platform_admin`
- `themes` — one row per theme (id, slug, visibility, monetization stub)
- `theme_versions` — immutable: (theme_id, semver, manifest, package_url, changelog, min_platform_version)
- `theme_installs` — (tenant_id, theme_id, active_version_id, auto_update_policy)
- `merchant_theme_settings` — (install_id, settings JSONB, sections JSONB) — never overwritten by updates
- `published_snapshots` — (install_id, version_id, settings snapshot, published_at) — rollback targets
- `previews` — staging renders of pending updates/customizations
- `audit_log` — every publish/update/rollback with actor + diff summary

## 4. Theme package contract

```
my-theme/
  theme.json            # manifest: id, version, categories, styles, compatibility
  config.schema.json    # JSON Schema for all customizable settings
  sections/             # section definitions (schema + default content)
  assets/               # images, fonts (content-addressed)
  locales/              # i18n strings (incl. RTL-ready)
```

- Themes are **static, sandboxed artifacts**. No server-side code execution.
- Rendering happens in a sandboxed iframe from schema + merchant settings.
- All data via typed platform APIs; themes never query the DB directly.

## 5. Safe update flow (spec §9)

1. New `theme_versions` row published → installs on older version get a notification.
2. Merchant opens changelog → "Preview update" creates a `previews` row (staging).
3. Platform runs compatibility check: migrate settings via schema; list incompatible settings.
4. Auto-snapshot of current published state → `published_snapshots`.
5. Merchant approves → new version goes live; old snapshot retained for rollback.
6. Rollback = re-publish a previous snapshot (one click, audited).

## 6. Scaling path (pay as you grow)

- **Day 1 (small VPS):** API + worker + Postgres + Redis + Caddy in one
  `docker-compose.yml`. Single container set, ~1–2 GB RAM.
- **Growth:** move Postgres/Redis to managed services; run API behind a
  load balancer with 2+ replicas (stateless by design — sessions in Redis/JWT).
- **Later:** split `worker` (previews, notifications) onto its own host/queue;
  put theme packages + assets on CDN (S3 + CloudFront-style).

Nothing in the business logic needs to change between these stages — only `deploy/`.
