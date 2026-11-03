# Deployment — launch cheap on a small VPS, scale later

## Target: single VPS (~$5–10/month, 2 GB RAM)

Everything runs in Docker Compose on one machine:

| Service | Image | Notes |
|---|---|---|
| `api` | built from `apps/api` | NestJS, stateless |
| `worker` | built from `apps/worker` | BullMQ jobs |
| `db` | `postgres:16-alpine` | volume-persisted |
| `redis` | `redis:7-alpine` | queue + cache |
| `caddy` | `caddy:2-alpine` | reverse proxy, **automatic HTTPS** |

Public traffic only hits Caddy (80/443). Nothing else is exposed.

## Launch steps

```bash
# on the VPS
git clone <repo> && cd brand-beats-os
cp .env.example .env   # fill secrets: DB password, JWT secret
docker compose -f deploy/docker-compose.yml up -d --build
# Caddy fetches TLS certs automatically for your domain
```

## VPS setup, step by step (~30 minutes, ~$5–10/mo)

1. **Provision:** any 2 GB RAM VPS (Hetzner, DigitalOcean, etc.), Ubuntu 24.04.
2. **DNS:** point `A` records of your domain AND `app.<domain>` at the VPS IP.
   (The merchant dashboard + storefront preview live at `app.<domain>`; a
   wildcard `*.` record also works.)
3. **Harden SSH:**
   ```bash
   # disable password login, keep key-only
   sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
   sudo systemctl restart ssh
   sudo ufw allow 22,80,443/tcp && sudo ufw enable
   ```
4. **Install Docker:** `curl -fsSL https://get.docker.com | sh`
5. **Deploy:**
   ```bash
   git clone <repo-url> brand-beats-os && cd brand-beats-os
   cp .env.example .env && nano .env   # set DOMAIN, POSTGRES_PASSWORD, JWT_SECRET (long random)
   NODE_ENV=production docker compose -f deploy/docker-compose.yml up -d --build
   ```
   The API refuses to boot in production with placeholder secrets.
   On first production boot the API automatically runs pending DB migrations
   (`migrationsRun: true`); it never uses `synchronize` in production.
   Check migration status anytime with, from `apps/api`:
   `DATABASE_URL=... npx typeorm migration:show -d dist/database/data-source.js` (after `npm run build`).
6. **Verify:** `curl https://your-domain/v1/health` → `{"ok":true,...}` and
   open `https://app.your-domain` for the merchant dashboard. Validate the
   compose file first with `docker compose -f deploy/docker-compose.yml config`.
7. **Backups:** install the nightly backup cron:
   ```bash
   sudo cp deploy/backup.sh /usr/local/bin/bb-backup
   sudo chmod +x /usr/local/bin/bb-backup
   (sudo crontab -l; echo "0 3 * * * /usr/local/bin/bb-backup /opt/brand-beats-os") | sudo crontab -
   ```
8. **Run the integration tests** in `docs/QA_CHECKLIST.md` §3 before announcing launch.

## Cost control rules

1. No managed DB/Redis at launch — containers on the same VPS.
2. Theme packages + assets served from local S3-compatible container
   (or plain volume) until traffic justifies object storage.
3. One deploy = `git pull && docker compose up -d --build`. Zero-downtime
   is a later optimization, not a launch requirement.
4. Backups: nightly `pg_dump` to an off-site bucket (cheap object storage).

## When to scale (triggers, not guesses)

- **API CPU > 70% sustained** → add 2nd API replica + Caddy load-balance.
- **DB > 70% disk or RAM** → move to managed Postgres.
- **Preview builds queue up** → move `worker` to its own VPS.
- **Assets slow worldwide** → put theme packages behind a CDN.

Each step changes only `deploy/` — application code is already stateless
and infra-agnostic (see ARCHITECTURE.md §2.5, §6).
