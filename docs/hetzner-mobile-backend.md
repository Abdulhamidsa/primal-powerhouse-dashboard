# Deploying on the existing Hetzner server

> This document describes an optional/legacy Docker/Hetzner path. The provisional canonical production path is the host-managed PM2/Next.js standalone deployment documented in [docs/pm2-production-operations.md](pm2-production-operations.md). Do not treat Docker or Compose as active production evidence until the host is explicitly confirmed to use them.

The verified production host is `client-vps-01` with a native PostgreSQL 16
instance. The active Primal runtime is PM2/Next.js standalone at
`/var/www/primal-powerhouse-dashboard`, behind Caddy. This document remains an
optional/legacy Docker path and is not evidence that Docker is active in production.

## Before deploying

- Confirm the configured database IP belongs to this server and `primal_prod` is the live database. Check the deployed website's environment separately.
- Inspect ports, the active Caddy proxy, PostgreSQL access rules, disk usage, and backups. The verified Primal listener is `127.0.0.1:3000`; legacy Docker port 3001 is not production evidence.
- Confirm `primal_test` isolation, migration history, and a successful backup restore into a dedicated restore-test database.
- Store runtime secrets in `/etc/primal/backend.env` with restricted permissions. Never put them in the image or mobile `EXPO_PUBLIC_*` variables.
- Restrict PostgreSQL to authorized local/container clients. Check MongoDB firewall requirements before changing anything; its existing container publishes port 27017 on all interfaces.

## Application deployment (legacy/optional Docker path)

Build the Docker image in Linux CI or Docker Desktop's Linux engine rather than on the small production VPS. Pin the deployed image by immutable tag/digest. `docker-compose.hetzner.yml` starts only Next.js and reuses existing PostgreSQL. The database hostname must resolve inside the container; `host.docker.internal` maps to the Docker host where appropriate.

The canonical host uses Caddy and forwards to `127.0.0.1:3000`. Do not install a
second proxy or change the active PM2 runtime based on this legacy Docker section.

Reconcile production schema and migration history before any deploy: development replay required two recovery migrations for previously omitted objects. They must not be blindly deployed to an existing production schema. The mobile migration adds session/push tables, client session invalidation, and message retry deduplication. Apply only the reviewed production migration sequence before routing to the new image. Keep the previous image and proxy configuration for application rollback; retain additive database structures.

## Operations

- Use the host-native PostgreSQL backup service and timer documented in `docs/pm2-production-operations.md`. Off-server retention remains undecided.
- Keep encryption keys in a separately protected recovery process. Snapshots alone are not a tested database recovery procedure.
- Schedule POST `/api/push/mobile/receipts` every 15 minutes with a protected `Authorization: Bearer <CRON_SECRET>` header. Set `EXPO_ACCESS_TOKEN` if Expo enhanced push security is enabled.
- Monitor health, disk, memory, response times, API errors, and failed/unknown push deliveries. Docker log rotation is configured.
- Test website login, assignments, media, chat, and native traffic before cutover. Do not assume Vercel is unused until domain routing is verified.

The PM2 deployment, cleanup timer, local PostgreSQL lockdown, and migration state
have been verified on the production host. Backup restore verification and
off-server disaster recovery remain pending.
