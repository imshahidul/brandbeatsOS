# Theme Development Framework (Phase 2)

The contract every Brand Beats OS theme follows (spec §12). Implemented in
`packages/theme-sdk` (validation) and `apps/api/src/themes` (registry).
The sample theme in `themes/starter-fashion` proves the contract end-to-end.

## 1. What a theme is

A theme is a **static, sandboxed artifact** — no server-side code execution,
no database access. It ships:

```
my-theme/
  theme.json            # manifest: id, version, categories, styles,
                        # presentationModes, sections, minPlatformVersion, locales
  config.schema.json    # JSON Schema for merchant-customizable theme settings
  sections/             # per-section JSON Schemas + defaults (or inline in manifest)
  assets/               # images, fonts (content-addressed, served via CDN/volume)
  locales/              # i18n strings (RTL-ready)
```

## 2. Validation rules (enforced, not suggested)

`validateManifest()` (`packages/theme-sdk/src/validator.ts`):

- Structural validation against `theme-manifest.schema.json`
  (semver versions, slug patterns, known presentation modes).
- Section `type`s unique within the theme.
- Every section's `defaultSettings` must validate against its own `schema`
  (a theme can never ship self-inconsistent defaults).

`validateSettings(schema, settings)`:

- Used for merchant theme settings vs `config.schema.json`
  and for section instances vs their section schema.
- This is what powers the merchant customizer: **anything expressible in the
  schema (colors, button styles, text colors, spacing, toggles) becomes a
  visual control — no code changes, no redeploy.**

## 3. Publishing (immutable versions)

`ThemesService.publishVersion()` (`apps/api/src/themes/themes.service.ts`):

1. Manifest validated by the SDK — invalid manifests are rejected.
2. `manifest.id` must equal the theme's registered slug.
3. `version` must equal `manifest.version` (semver).
4. `(themeId, version)` is unique — **published versions are immutable**;
   an update is always a new version row (spec §8).

HTTP surface (marketplace/admin controllers) lands in Phase 3; the domain
layer above is complete and unit-verified (`verify-themes.js`: 9 checks).

## 4. How merchant customization maps to this framework

| Merchant want | Framework mechanism | Phase |
|---|---|---|
| Change website colors / text colors | Settings in `config.schema.json` → validated by `validateSettings` | P4 customizer UI |
| Change button styles | Same — schema-driven settings | P4 |
| Homepage builder (add/remove/reorder sections) | Section instances validated against manifest section schemas | P4 |
| Header logo / store name | Tenant-level white-label branding (`PATCH /v1/tenants/:id/branding`) — survives theme switches | P1 ✅ |
| New section types | Theme author adds a `SectionDefinition` → new theme version | P2 ✅ |

Because customization is schema-driven, adding a new customizable property
later is a **theme version bump, never a platform rewrite** — this is the
change-tolerance guarantee from `ARCHITECTURE.md`.

## 5. Security constraints (spec §13)

- Themes never execute server-side code; rendering is a sandboxed iframe
  fed by typed platform APIs (Phase 4).
- Upload pipeline (Phase 3) will run: manifest validation → schema validation
  → dependency scan → responsive/a11y/perf smoke tests before `published`.
