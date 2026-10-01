# Phase 5C provider and disclosure review

This is a repository-first evidence record. It does not approve legal documents
and does not confirm provider regions, DPAs, transfer mechanisms, subprocessors,
vendor retention, vendor deletion, or model-training terms.

## Verified runtime facts

- Production uses PM2 with the Next.js standalone application on `client-vps-01`.
- Caddy is the active reverse proxy; nginx is inactive.
- PostgreSQL 16 is native to the VPS and listens locally on `127.0.0.1:5432` and
  `::1:5432`.
- Privacy cleanup runs through systemd under the `primal` service user.
- Fourteen daily local PostgreSQL custom-format backups are configured.
- A restore drill has passed.
- The first automatic daily backup timer run remains pending overnight verification.
- No off-server disaster-recovery provider has been selected or verified.
- Production Azure OpenAI is in Sweden Central with the verified `gpt-4o`
  deployment (model version `2024-11-20`). Azure image generation is disabled
  because no verified image deployment is present; `AZURE_OPENAI_IMAGE_DEPLOYMENT`
  is optional and does not enable image generation without the explicit
  production opt-in.
- Web production has no Pusher server or client environment variables.
  Pusher realtime integration is present in the repository but inactive in web
  production; chat, notifications, and command-center data continue through
  database persistence and polling/revalidation. The web realtime message
  notification banner does not receive its realtime events without Pusher.
  Mobile `EXPO_PUBLIC_PUSHER_*` configuration remains unverified.

## Provider inventory

| Provider/service | Status | Repository evidence | Data categories | External confirmation required |
| --- | --- | --- | --- | --- |
| PostgreSQL | Active and production-configured | Prisma client, `DATABASE_URL`, native VPS database | Account, health, nutrition, training, messages, privacy, sessions, tokens | Hosting region, operator, backups, logs, encryption, replication, retention |
| Cloudinary | Active and production-configured | Media upload/delete routes, media manifest, meal image provider | Avatars, check-in photos, attachments, meal/exercise media | Region, DPA, subprocessors, retention, deletion propagation, backups |
| Web Push/VAPID | Active and production-configured | `web-push`, VAPID configuration, browser subscriptions | Push endpoints/keys and notification payloads | Browser push processing, retention, region, deletion behavior |
| Google OAuth | Active and production-configured | `google-auth-library`, OAuth start/callback, identity records | OAuth identity subject, email, name | Processing, retention, region, transfer, DPA/terms |
| Resend | Active and production-configured | Transactional email client and verification/reset flows | Email address, display name, transactional links | Sending region, logs, retention, DPA, subprocessors, transfers |
| Azure OpenAI | Chat active; image-generation code present but production-disabled | Chat calls, image-provider code, and Azure configuration | Meal, ingredient, nutrition, preference context, prompts | Deployment region, prompt retention, training/service improvement, DPA, subprocessors; image deployment remains unverified |
| ExerciseDB/RapidAPI | Active and production-configured | Exercise search/import routes and RapidAPI configuration | Exercise search/filter terms and exercise content | Upstream provider, query logs, retention, region, DPA |
| Pusher | Repository-present; web production unconfigured/inactive; mobile configuration unresolved | Optional server/client realtime integrations and auth route | No web production Pusher processing currently; mobile data flow remains unverified | Mobile `EXPO_PUBLIC_PUSHER_*` configuration, cluster, retention, logs, DPA |
| USDA FoodData Central | Code-active; production configuration unknown | Food search/detail routes and USDA API URL | Food queries, filters, FDC IDs | Production key/configuration, logging, retention, region, DPA |
| Expo Push | Code-active; production usage unknown | Mobile push send/receipt calls to Expo | Device tokens, notification payloads, receipt IDs | Production usage, region, retention, DPA, subprocessors |
| Open Food Facts | Legacy/inactive by inspected direct calls | Legacy service naming; active food routes use USDA URLs | Food abstraction only | Confirm no deployed route still calls Open Food Facts |
| PM2/Caddy/VPS | Active runtime infrastructure | Verified host deployment | Traffic, logs, local storage, local backups | VPS operator/region, log retention, backup protection, alerting |

No active analytics, marketing, payment, or error-tracking SDK was identified in
the inspected application code. Compatibility flags do not prove an active
tracking implementation.

## Data-flow map

| Data category | Application/provider flow | Status |
| --- | --- | --- |
| Account/profile | PostgreSQL; Google OAuth identity values when Google signup is used | Code-verified; vendor terms pending |
| Email/authentication | PostgreSQL and Resend; Google OAuth during identity exchange | Code-verified; vendor terms pending |
| Body metrics and health | PostgreSQL; only feature-relevant minimized context may enter AI prompts | Code-verified at storage; each AI payload under review |
| Nutrition and meals | PostgreSQL; Azure OpenAI chat for supported generation; USDA for food search; image-generation code is production-disabled pending a verified deployment | Code-verified; provider facts pending |
| Workouts and exercise content | PostgreSQL; ExerciseDB/RapidAPI for search/import | Code-verified; provider facts pending |
| Check-ins and photos | PostgreSQL and Cloudinary | Code-verified; vendor facts pending |
| Messages and attachments | PostgreSQL persistence, optional Pusher realtime code path, Cloudinary attachments, notification providers; web chat and notification state falls back to polling/revalidation when Pusher is unconfigured | Code-verified; no web production Pusher processing; mobile Pusher usage and provider facts pending |
| AI prompts/context | Azure OpenAI chat calls; image-generation code is present but production-disabled; meal context boundary excludes direct account identifiers | Primary boundary tested; route-level review remains required |
| Push tokens | PostgreSQL, Web Push/VAPID, and Expo code paths | Browser production configured; mobile production usage unknown |
| Exports | Application-generated export files and local application storage | No off-server export provider identified |
| Backups | Local PostgreSQL custom-format archives, 14-dump retention | Restore passed; off-server DR unselected |

## Legal-document status

The five registry documents remain `DRAFT`, use the draft version
`draft-2026-09-28`, have no effective date, and cannot activate mandatory
acknowledgement. Review markers remain intentional:

- Privacy Policy: operator, contact, legal bases, rights, complaints, transfers,
  provider regions/contracts, and retention guarantees.
- Terms: payment, refunds, jurisdiction, liability, warranties, complaints, and
  intellectual-property language.
- Health Disclaimer: final health, medical, coaching, nutrition, and AI wording.
- AI Disclosure: deployment region, prompt/output retention, training/service
  improvement, contractual protections, and route-specific payload scope.
- Storage Notice: tracking status must remain conditional on deployment evidence.

The registry must not be changed to `APPROVED` until legal review markers are
resolved and the separate approval conditions pass.

## Operator evidence still required

For every configured provider, capture sanitized evidence for account/deployment,
region, DPA, transfers, subprocessors, retention/deletion, training/service
improvement, backups, logging, and health/user-content processing. Do not record
keys, passwords, tokens, or full environment files.

Also confirm the first automatic backup timer execution from journald using only
the run timestamp, archive identifier, result, duration, and sanitized failure
information if applicable.

## Scope split

Can proceed from repository evidence:

- inventory and data-flow documentation;
- shared privacy-center disclosure summaries;
- verified local-backup and restore wording;
- provider-reference and AI-minimization scans;
- web/mobile parity tests;
- stale documentation correction.

Must wait for external or legal confirmation:

- provider regions, DPAs, transfers, subprocessors, retention, and deletion;
- final legal wording or document approval;
- mandatory acceptance activation;
- active-account retention decisions;
- off-server backup provider selection;
- claims about vendor backups or immediate vendor erasure.
