# Phase 3 data review

Phase 5C extends this evidence record in
[phase-5c-provider-review.md](phase-5c-provider-review.md). The current runtime
has verified local PostgreSQL backups and a passed restore drill; off-server
disaster recovery remains unselected.

This inventory records repository evidence only. Deployment configuration, provider contracts, regions, backups, and vendor retention must be confirmed operationally; unknown values are intentionally not inferred.

## Data and retention categories

| Category | Application source/storage | Access and deletion | Retention status |
| --- | --- | --- | --- |
| Profile and account | `Client`, auth identities, profile APIs | Phase 1 projections/authorization; Phase 2 minimization and hard deletion | Existing 30-day deletion window |
| Health, check-ins, nutrition, training | Client profile metrics, `HealthMetric`, daily/weekly logs, meal/workout records | Authorized client/staff access; explicit export projections; deleted at hard deletion | Active-account period is `PRODUCT/LEGAL DECISION REQUIRED` |
| Messages and attachments | Conversations/messages, attachment metadata, Cloudinary references | Conversation authorization; export metadata; Phase 2 manifest cleanup | Active-account period is `PRODUCT/LEGAL DECISION REQUIRED` |
| Consent and preferences | `ConsentRecord`, `ClientNotificationPreference`, legacy Client projections | Client privacy routes; append-only history; cascade with client | Retained with client until hard deletion |
| Exports | `PrivacyExportJob` and hashed download tokens | Owner-only, expiring, one-time download behavior | Existing approximately 24-hour expiry |
| Audit logs | `AuditLog` | Restricted operational access | Existing 365-day retention |
| Sessions and push | Web auth invalidation, `MobileSession`, browser/mobile subscriptions | Immediate revoke/delete on confirmed deletion | Existing lifecycle; no new period introduced |

## Processor and external-service inventory

| Provider/service | Repository evidence | Data sent or stored | Region/retention/DPA |
| --- | --- | --- | --- |
| PostgreSQL via Prisma | `DATABASE_URL`, Prisma schema, native local PostgreSQL | Application records, including health and messages; 14 local daily custom-format backups | VPS/provider region, off-server replication, and vendor retention unknown |
| Cloudinary | Upload/delete helpers and media routes | Avatars, check-in/progress photos, attachments, meal images; public IDs and resource types | Vendor retention/backups/region require confirmation |
| Resend | Transactional email client | Email address, display name, verification/reset link token | Provider retention/region/DPA require confirmation |
| Google OAuth | OAuth start/callback and identity model | OAuth code and provider identity email/name/account ID | Google processing and transfer terms require confirmation |
| Azure OpenAI | Active chat provider; image-generation code present but production-disabled pending a verified deployment | Minimized meal, ingredient, nutrition, and prompt text | Deployment/region/log retention/DPA require confirmation; no verified image deployment is enabled for production |
| USDA FoodData Central | Food search routes | Search terms and food filters; no intentional account identity | Provider logging/retention require confirmation |
| ExerciseDB/RapidAPI | Exercise routes | Exercise search/filter terms | Provider logging/retention/region require confirmation |
| Pusher | Optional realtime server/client code path; unconfigured and inactive in web production | No web production message or notification data is currently sent to Pusher; mobile usage remains unverified | Mobile `EXPO_PUBLIC_PUSHER_*` configuration, cluster, retention, region, and DPA require confirmation |
| Browser push services | Web Push subscription and delivery | Endpoint/keys and notification payloads | Browser-vendor processing/retention require confirmation |
| Expo/mobile push services | Mobile push device and delivery code | Device token and notification payloads | Provider processing/retention/region require confirmation |
| Hosting/runtime | Verified PM2/Caddy/VPS deployment | Application traffic, logs, local storage, and local backups | VPS operator/region, log retention, alerting, and off-server recovery unknown |

No active analytics SDK, payment processor, or error-tracking provider was found in the inspected application code. The legacy analytics, marketing, and optional-tracking flags remain compatibility data and are not active controls.

## Storage classification

- Authentication: auth cookies, OAuth state cookie, SecureStore session.
- Functional preferences: theme, appearance, handbook progress, sidebar/install state.
- User/offline data: offline metadata, service-worker private caches, shopping lists, drafts, mobile resource caches, pending messages, AsyncStorage preferences.
- Notification infrastructure: browser/mobile push permissions, subscriptions, device tokens.
- Optional tracking: no active storage or SDK identified.

Browser and mobile cleanup remains best effort and is not the deletion authority.

## Open decisions

- Minimum age and minor-account policy: `PRODUCT/LEGAL DECISION REQUIRED`.
- Policy/terms acceptance requirements and versions: `PRODUCT/LEGAL DECISION REQUIRED`.
- Active-account retention periods: `PRODUCT/LEGAL DECISION REQUIRED`.
- AI disclosure or affirmative consent: `PRODUCT/LEGAL DECISION REQUIRED`.
- Analytics, marketing, and optional-tracking roadmap: `PRODUCT/LEGAL DECISION REQUIRED`.
- Provider regions, transfers, contracts, DPAs, backups, and logs: operational/legal confirmation required.
