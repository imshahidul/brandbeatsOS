# Security — non-negotiable checklist

Every phase must satisfy this checklist before it is considered done.
Checked items must be verifiable in code/tests, not just documented.

## 1. Authentication & authorization

- [ ] Passwords hashed with argon2id (never bcrypt-sha1 chains, never MD5/SHA1).
- [ ] JWT access tokens short-lived (15 min); refresh tokens rotated + stored hashed.
- [ ] RBAC enforced at the service layer, not just the controller: roles
      `merchant`, `merchant_admin`, `platform_admin`.
- [ ] **Tenant isolation:** every query scoped by `tenant_id` from the auth
      context. A merchant can never read/write another tenant's rows —
      covered by automated tests.
- [ ] Admin routes under `/v1/admin/*`, guarded separately.

## 2. Input & API safety

- [ ] All inputs validated with DTOs (class-validator) — no raw `req.body` passthrough.
- [ ] JSON-Schema validation for theme manifests and merchant settings
      (via `@packages/theme-sdk`).
- [ ] Rate limiting on auth + public endpoints (throttler).
- [ ] File uploads: allowlist of MIME types, size caps, scanned file names,
      stored outside web root (S3-compatible), never executed.

## 3. Theme sandboxing (spec §13)

- [ ] Theme packages are static artifacts — **no server-side code execution**.
- [ ] Storefront preview rendering runs in a sandboxed iframe
      (`sandbox="allow-scripts"` only where needed, never `allow-same-origin`
      with platform cookies).
- [ ] Themes access data only through typed platform APIs.
- [ ] Theme publish pipeline: manifest validation → schema validation →
      dependency scan → automated responsive/a11y/perf smoke tests.

## 4. Data protection

- [ ] Secrets only via environment variables; `.env` never committed
      (`.env.example` committed with placeholders).
- [ ] DB credentials least-privilege; backups encrypted.
- [ ] PII minimized; audit log records *actions*, not sensitive payloads.
- [ ] HTTPS everywhere in production (Caddy automatic TLS).

## 5. Operational security (small VPS)

- [ ] SSH key-only, no password login; firewall allows 80/443/22 only.
- [ ] `docker-compose` services not exposed publicly except via Caddy.
- [ ] Dependabot-style updates: `npm audit` in CI; fail build on high-severity.
- [ ] Health endpoint `/v1/health` (no sensitive info); structured logs without secrets.

## 6. Change-safety (security vs. speed)

- Requirement changes go through: new/updated module → DTO validation →
  migration (never destructive) → tests → audit-logged deploy.
- Theme updates can never delete merchant data (enforced by
  `merchant_theme_settings` immutability rule in ARCHITECTURE.md §4).
