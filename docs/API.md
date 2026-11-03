# API Reference (v1)

Base URL: `https://<domain>/v1`. All endpoints below are implemented and verified
in `apps/api`. Breaking changes will ship as `/v2` — `/v1` keeps working.

## Auth

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| `GET` | `/health` | — | — | Liveness probe, no sensitive data |
| `POST` | `/auth/register` | — | `{email, password, storeName?}` | Creates user (`merchant`) + tenant workspace where user is `merchant_admin`. Throttled: 5/min |
| `POST` | `/auth/login` | — | `{email, password}` | Same 401 message for unknown email vs wrong password (no enumeration). Throttled: 5/min |
| `POST` | `/auth/refresh` | — | `{refreshToken}` | **Rotates**: old token revoked, new pair issued |
| `POST` | `/auth/logout` | — | `{refreshToken}` | Revokes the refresh token |
| `GET` | `/auth/me` | Bearer | — | Current user (no password hash ever returned) |

Tokens: `accessToken` (JWT, 15 min, `{sub, email, roles}`), `refreshToken`
(opaque 96-hex, stored as SHA-256 hash only, 30 days, single-use via rotation).

## Tenants (merchant workspaces)

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/tenants` | Bearer | `{name, slug?}` — creates tenant, caller becomes `merchant_admin` |
| `GET` | `/tenants` | Bearer | Tenants the user belongs to (with their role) |
| `PATCH` | `/tenants/:id/branding` | Bearer + `X-Tenant-Id` + `merchant_admin` | White-label branding (see below) |

### White-label branding

`PATCH /v1/tenants/:id/branding` — the merchant's own branding on their
storefront frontend:

```json
{
  "name": "My Fashion Store",
  "logoUrl": "https://cdn.example.com/logo.png",
  "faviconUrl": "https://cdn.example.com/favicon.ico"
}
```

- All fields optional; `logoUrl`/`faviconUrl` must be absolute HTTPS URLs.
- Tenant-level: **survives theme installs, switches, and updates**.
- Theme-level brand identity (colors, fonts, buttons) is per-theme
  customization and ships with the Theme Framework (Phase 2) / Customizer (Phase 4).

## Conventions

- `Authorization: Bearer <accessToken>` on all non-public routes.
- Tenant-scoped routes additionally require `X-Tenant-Id` (verified membership).
- Validation errors → `400` with field details; unknown routes → `404`.
- Mutating non-auth requests are written to `audit_log`.

## Marketplace (merchant — Bearer + `X-Tenant-Id`)

| Method | Path | Body / Query | Notes |
|---|---|---|---|
| `GET` | `/marketplace/themes` | `?search=&category=&style=&presentationMode=` | Public themes only; shows latest published version + `installed` flag |
| `GET` | `/marketplace/themes/:slug` | — | Detail, published versions (with manifests for preview), install state |
| `POST` | `/marketplace/installs` | `{slug}` | Installs latest published version; `409` if already installed |
| `GET` | `/marketplace/installs` | — | This tenant's installs with active version |
| `POST` | `/marketplace/installs/:id/switch` | `{versionId}` | Switch to another **published** version of the same theme |
| `PATCH` | `/marketplace/installs/:id/auto-update` | `{policy: 'manual'|'auto'}` | Update policy (safe-update engine honors it in Phase 5) |
| `DELETE` | `/marketplace/installs/:id` | — | Uninstall |

Tenant isolation is enforced in every query — a tenant can never see or
touch another tenant's installs (verified in `verify-marketplace.js`).

## Admin (platform_admin only)

| Method | Path | Body | Notes |
|---|---|---|---|
| `POST` | `/admin/themes` | `{slug, name}` | Register a theme (starts `private`) |
| `GET` | `/admin/themes` | — | All themes including private/deprecated |
| `POST` | `/admin/themes/:id/versions` | `{version, manifest, configSchema, changelog?, packageUrl?}` | Publish immutable version (SDK-validated) |
| `PATCH` | `/admin/themes/:id` | `{visibility?: 'public'|'private'|'deprecated', monetization?}` | Release / deprecate |

## Customizer (merchant — Bearer + `X-Tenant-Id`)

| Method | Path | Body | Notes |
|---|---|---|---|
| `GET` | `/customizer/installs/:installId` | — | Draft + `configSchema` + `sectionsAvailable` — everything the editor UI needs to render controls |
| `PUT` | `/customizer/installs/:installId/settings` | `{settings}` | Colors, buttons, typography… validated against the theme's `config.schema.json` |
| `PUT` | `/customizer/installs/:installId/sections` | `{sections: [{id, type, settings, hidden?}]}` | Homepage builder: order = render order; types, settings, `maxInstances` and id-uniqueness enforced |
| `POST` | `/customizer/installs/:installId/publish` | — | Full re-validation → immutable `published_snapshots` row |
| `GET` | `/customizer/installs/:installId/published` | — | Latest snapshot — what the live storefront renders |
| `GET` | `/customizer/installs/:installId/preview` | — | Storefront document for the sandboxed preview: white-label branding + theme + settings + visible sections |

Design rules: drafts are never rendered live — only published snapshots are.
A theme version with a stricter schema blocks publishing of stale drafts
until the merchant fixes the flagged settings (never auto-deleted).

## Updates (merchant — Bearer + `X-Tenant-Id`)

| Method | Path | Body | Notes |
|---|---|---|---|
| `GET` | `/updates` | — | Update notifications: installs with newer published versions + changelogs |
| `POST` | `/updates/:installId/check` | `{targetVersionId}` | Compatibility report — issues + schema diff, no mutation |
| `POST` | `/updates/:installId/stage` | `{targetVersionId}` | Start staging (seeded from current draft) |
| `GET` | `/updates/:installId/stage` | — | Staging + current issues |
| `PUT` | `/updates/:installId/stage/settings` | `{settings}` | Fix staged settings against the target schema |
| `PUT` | `/updates/:installId/stage/sections` | `{sections}` | Fix staged sections against the target manifest |
| `DELETE` | `/updates/:installId/stage` | — | Discard staging |
| `POST` | `/updates/:installId/stage/apply` | — | Backup → switch version → publish snapshot; **blocked while issues remain** |
| `GET` | `/updates/:installId/snapshots` | — | Rollback targets (newest first) |
| `POST` | `/updates/:installId/rollback` | `{snapshotId}` | One-click rollback: restores version + settings + sections |

## Admin — updates

| Method | Path | Notes |
|---|---|---|
| `POST` | `/admin/updates/auto-apply` | Executes `auto` policies: applies **only fully-compatible** updates; incompatible installs are reported, never force-updated |

Safety guarantees (all verified in `verify-updates.js`): every apply and
rollback first writes an immutable backup snapshot; published versions are
immutable; a merchant's data is never silently dropped — incompatibilities
are reported and must be resolved in staging first.
