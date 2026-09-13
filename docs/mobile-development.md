# Native app: Windows development

## Database boundary

The saved, commented test connection was verified on September 11, 2026. Local `.env.dev` now uses that connection for both `DATABASE_URL` and `DIRECT_URL`: `primal_test` as `primal_test_user`. `.env` and `.env.prod` were preserved. Only the development and shadow databases have been migrated.

The initial audit found 11 public tables, one client, one user, and only the initial migration applied. Historical migration replay revealed a missing food-catalog prerequisite and other omitted schema changes. Two recovery migrations now make a fresh replay match `schema.prisma`. The test database was migrated to 56 public tables after replaying the complete history in the shadow database. Server-side row hashes verified that all 10 pre-existing data tables retained every original row and column value. Existing client records were not used as fixtures.

The user created `primal_test_shadow`, owned by `primal_test_user`, using:

```bash
sudo -u postgres createdb --owner=primal_test_user primal_test_shadow
```

`SHADOW_DATABASE_URL` is now configured locally using the verified test credentials. Connectivity, ownership, and table-creation permission have been verified. The role does not require CREATEDB because the dedicated shadow database already exists.

The test role has CONNECT permission on `primal_prod`. A read-only catalog audit using that test role found zero application tables with direct read/write privileges, no permission to create schemas, and no permission to create public objects. No production client records were read. Broader server access, function privileges, and network restrictions remain deployment checks; do not modify production grants without reviewing other applications.

Run `node scripts/check-development-database.cjs` for a read-only connection and shadow audit. It prints no credentials or client records and exits unsuccessfully when shadow setup is incomplete.

`node scripts/assert-development-database.cjs --migration` checks configuration without connecting. `node scripts/migrate-development-database.cjs` verifies historical checksums, replays migrations in the disposable shadow database, applies development migrations, and checks preservation of existing columns/rows. This wrapper is for additive development migrations; migrations intentionally changing existing data need a separate reviewed validation strategy.

Production-mode verification uses `.cache/mobile/next-build` through `NEXT_DIST_DIR`, so it can run while `pnpm dev` continues using `.next`. Run `node scripts/verify-web-build.cjs` before the HTTP integration runner so the isolated server uses the current source.

**Do not run the recovered history against production without reconciliation.** Production may already contain objects created outside this history. The recovery migration also refuses to discard nonempty legacy daily-check-in compliance values. No production migration has been applied.

## Windows commands

For the local Chrome preview, keep `EXPO_PUBLIC_API_URL=http://localhost:3000` in the ignored `apps/mobile/.env`, run `pnpm dev`, then `pnpm --dir apps/mobile web --clear` in another terminal. Open http://localhost:8081. Development web builds permit loopback HTTP; native and production builds still require HTTPS.

Web sessions use browser sessionStorage, separate from the offline data cache. Reloading the tab restores the session; closing the tab normally clears it. Native builds continue using Expo SecureStore. If site storage is blocked, sign-in displays a storage-specific error. Browser tests cover save/restore, rotating refresh, logout, denied storage, and server rendering. A web export passes; the interactive walkthrough remains pending because the browser automation tool failed to initialise in this session.

```powershell
pnpm install
pnpm dev
# Second PowerShell terminal:
Copy-Item apps/mobile/.env.example apps/mobile/.env
# Edit the file and provide the HTTPS test API URL.
pnpm mobile:start
```

An iPhone cannot access your Windows API through `localhost`. Use a reachable HTTPS staging API and synthetic accounts. The app requires HTTPS. Database credentials never go into the mobile environment.

This project pins Expo SDK 55. Fast Refresh handles most screen changes; native dependency/config changes require a new development build. Use a compatible development build rather than assuming current Expo Go supports this SDK.

```powershell
pnpm mobile:type-check
pnpm --dir apps/mobile exec expo export --platform ios
pnpm exec vitest run
node --test scripts/database-isolation.test.cjs
pnpm exec vitest run --config apps/mobile/vitest.config.mts
node scripts/verify-web-build.cjs
node scripts/mobile-api-integration.cjs
```

The integration runner starts a loopback production-mode Next.js server with test-only signing/encryption keys and external-service credentials disabled. It creates random synthetic coach/client fixtures, exercises real HTTP and database behavior, and removes its fixtures afterward. No production personal data is copied. Results and local server logs go to ignored `.cache/mobile/`; successful empty-account API timings are not real-device startup measurements.

## iPhone builds and release

Set `ios.bundleIdentifier` in `apps/mobile/app.json` using the actual Apple identity. Link to the user's Expo project and configure `EXPO_PUBLIC_EAS_PROJECT_ID`. From `apps/mobile`, use `npx eas-cli build --platform ios --profile development` after signing into the correct Expo and Apple accounts. Install that build on a registered physical iPhone, then run the development server on Windows.

Production requires the production API URL in EAS environment configuration and a separate production build. `npx eas-cli submit --platform ios --latest` uploads an approved production build. These commands have not been executed. Native push, camera, microphone, keyboards, backgrounding, and playback need real-device verification.

See `mobile-parity.md` for acceptance evidence. Type checks and JavaScript export do not prove full parity, server connectivity, or App Store readiness.
