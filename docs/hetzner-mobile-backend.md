# Deploying on the existing Hetzner server

The user-reported server has about 4 GiB RAM, 2 vCPUs, PostgreSQL 16, MongoDB in Docker, and 11 GiB available disk. This is not a capacity test. Preserve existing applications.

## Before deploying

- Confirm the configured database IP belongs to this server and `primal_prod` is the live database. Check the deployed website's environment separately.
- Inspect ports, existing proxy, PostgreSQL access rules, disk usage, and backups. Verify proposed app port 3001 is unused.
- Confirm `primal_test` isolation, migration history, and a successful backup restore into a dedicated restore-test database.
- Store runtime secrets in `/etc/primal/backend.env` with restricted permissions. Never put them in the image or mobile `EXPO_PUBLIC_*` variables.
- Restrict PostgreSQL to authorized local/container clients. Check MongoDB firewall requirements before changing anything; its existing container publishes port 27017 on all interfaces.

## Application deployment

Build the Docker image in Linux CI or Docker Desktop's Linux engine rather than on the small production VPS. Pin the deployed image by immutable tag/digest. `docker-compose.hetzner.yml` starts only Next.js and reuses existing PostgreSQL. The database hostname must resolve inside the container; `host.docker.internal` maps to the Docker host where appropriate.

Configure the existing HTTPS reverse proxy to forward to `127.0.0.1:3001`, preserving Host and X-Forwarded-Proto, allowing established multipart upload limits and sufficient timeouts. Do not install a second proxy on occupied ports 80/443.

Reconcile production schema and migration history before any deploy: development replay required two recovery migrations for previously omitted objects. They must not be blindly deployed to an existing production schema. The mobile migration adds session/push tables, client session invalidation, and message retry deduplication. Apply only the reviewed production migration sequence before routing to the new image. Keep the previous image and proxy configuration for application rollback; retain additive database structures.

## Operations

- Schedule PostgreSQL-aware daily `pg_dump -Fc` backups with encrypted off-server retention. Rehearse `pg_restore` into a separate database. Use protected PostgreSQL password files rather than command-line credentials.
- Keep encryption keys in a separately protected recovery process. Snapshots alone are not a tested database recovery procedure.
- Schedule POST `/api/push/mobile/receipts` every 15 minutes with a protected `Authorization: Bearer <CRON_SECRET>` header. Set `EXPO_ACCESS_TOKEN` if Expo enhanced push security is enabled.
- Monitor health, disk, memory, response times, API errors, and failed/unknown push deliveries. Docker log rotation is configured.
- Test website login, assignments, media, chat, and native traffic before cutover. Do not assume Vercel is unused until domain routing is verified.

No production deployment, DNS change, scheduled job, production migration, or backup configuration has been executed. Development migrations have been tested and applied to `primal_test`; its disposable shadow database has been used for replay verification.
