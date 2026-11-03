# Brand Beats OS — Theme Marketplace & Storefront Template Ecosystem

> Monorepo for the Brand Beats OS Theme Marketplace module.
> Docs are in English so future hired developers can use them directly.

## The deal

- **Owner (non-technical):** marketing, clients, business.
- **Build:** done A-to-Z by the AI agent, starting from zero.
- **Later:** developers get hired after launch; every doc here is written as a handover doc.

## Design principles (non-negotiable)

1. **Security-first** — see `docs/SECURITY.md`. No feature ships without passing the checklist.
2. **Change-tolerant** — see `docs/ARCHITECTURE.md`. Mid-project requirement changes must not overturn the codebase. Modularity + versioned APIs + config-driven themes.
3. **Docs match code** — no hallucinated docs. Every documented endpoint/behavior must exist in code and be verifiable.
4. **Cheap launch** — must run on a single small VPS (~$5–10/mo) with Docker Compose. See `docs/DEPLOYMENT.md`. Scale later, pay later.

## Monorepo layout

```
brand-beats-os/
  apps/
    api/            # NestJS REST API (marketplace, admin, customizer, themes)
    worker/         # BullMQ background jobs (theme publish, previews, notifications)
  packages/
    theme-sdk/      # Theme manifest + config-schema validation (shared by API & themes)
    shared/         # Shared types, DTOs, constants
  docs/
    ARCHITECTURE.md
    SECURITY.md
    DEPLOYMENT.md
    API.md            # generated/maintained alongside code
  deploy/
    docker-compose.yml
    Caddyfile         # reverse proxy + automatic HTTPS
```

## Quick start (local dev)

```bash
# 1. install
npm install

# 2. start infra (Postgres + Redis)
docker compose -f deploy/docker-compose.yml up -d db redis

# 3. run API
npm run dev --workspace=apps/api
```

API listens on `http://localhost:3000`, health check at `/v1/health`.

## Phases

- **P0** — Scaffold + foundation docs (this)
- **P1** — Core: auth/RBAC, tenants, DB schema, API versioning
- **P2** — Theme Framework: manifest, config schema, section SDK
- **P3** — Marketplace + Admin backend
- **P4** — Visual Customizer + Section Builder + live preview
- **P5** — Version control, safe update, rollback, snapshots
- **P6** — Security hardening, QA, VPS deploy guide, handover docs
