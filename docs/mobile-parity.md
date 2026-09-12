# User app parity and release evidence

Status is explicit: unchecked features are not verified. No production migrations or deployments are implied by local implementation.

| Flow | Existing endpoints | Native implementation | Device verified |
|---|---|---|---|
| Login/session/logout | /api/auth/mobile/* | Implemented; parity review pending | No |
| Today | /api/user/dashboard/summary | Implemented; parity review pending | No |
| Meals/options/swaps/completion | /api/user/meals/{options,selection,completions}, /api/user/adherence/current | Selection/swap/completion APIs verified; native portions, side choices/previews and snack slots implemented | No |
| Shopping | /api/user/meals/shopping-list | Generation API verified; native generation, checks/reset, copy/share and read cache implemented | No |
| Daily check-in/insights | /api/user/daily-checkins/{current,insights} | Implemented; offline and restored-draft submission guards added; parity review pending | No |
| Weekly check-in/photos | /api/user/weekly-checkins/current, /api/cloudinary/upload | Implemented; offline and restored-draft submission guards added; parity review pending | No |
| Training plan/session/sets/history | /api/user/training/* | Implemented; completed-session results render read-only; parity review pending | No |
| Workout assignments/session | /api/user/workout-assignments, /api/user/workout-sessions/* | Implemented; parity review pending | No |
| Assigned videos | /api/user/videos/* | Detail/completion API isolation verified; native detail, playback, instructions, notes and completion implemented | No |
| Chat/attachments/presence | /api/conversations/*, /api/realtime/pusher-auth | Implemented; parity review pending | No |
| Profile/avatar/coach | /api/auth/me, /api/user/profile/avatar, /api/user/coach | Implemented; offline mutation and restored-feedback guards added; parity review pending | No |
| Privacy/export/deletion/consent | /api/privacy/* | Implemented; sensitive actions disabled offline; parity review pending | No |

## Release prerequisites
- Test and shadow connections verified; development migrations applied with original rows preserved. Production privilege isolation still needs an administrator audit.
- Verify API host, Hetzner identity, existing proxy, disk headroom, and backup restore.
- Expo project, Apple team/bundle identity, enrolled Developer account, and physical iPhone.
- Native media, permissions, background/resume, push receipts, accessibility and visual parity.
- Measure cold/warm production-mode requests with synthetic accounts; no performance claims until measured.
- Confirm website-to-mobile and mobile-to-website behavior for every row.

## Verified locally on September 11, 2026

- Complete migration replay matches the Prisma schema; the migrated test database has 56 public tables. All original columns and rows in its 10 pre-existing data tables were preserved.
- Production-mode website build passes. Backend unit checks, development database guard checks, and mobile TypeScript checks pass.
- Real HTTP integration verifies mobile/browser login, rotating refresh tokens and replay rejection, expiry, logout/all-session revocation, deactivation, read access to client APIs, retry-safe daily check-ins, private export ownership, and recent-password enforcement.
- Website coach/client text chat works in both directions with deduplicated retries and conversation isolation. Native fallback uses the client conversation-provisioning GET rather than the coach-only POST.
- Website-created legacy workout assignments appear in the client API; session resume and repeated completion preserve one set of exercise logs.
- Website-created training plans and days also appear in the client API; resume returns the same session, foreign-client and invalid-set writes are rejected, and completed session difficulty, feedback, and calories persist.
- Native unit checks cover simultaneous refresh, account changes during pending requests, stale response rejection, serialized credential writes, targeted cache refresh after mutations, account-scoped cache removal on client changes, and cache removal after server-confirmed revocation.
- Meal integration now covers assigned options, another client's empty options, saved selections and swaps, assigned-portion nutrition totals, shopping generation, repeated completion, and undo. Fixtures use synthetic meals and are removed after the run.
- Meal completion now verifies that the meal/type/source assignment belongs to an active plan for the authenticated client. Integration rejects cross-client submissions with and without a source ID, and mismatched source assignments. Video detail/completion tests verify ownership and that completing one assignment leaves another unchanged; the completion handler now awaits Next.js route parameters.
- Native shopping automatically generates from saved selections, supports per-section checks/reset, preserves quantities when copying/sharing, and keys stored checks by day and selection fingerprint. Lists use the account-scoped read cache. Native nutrition display shares the website's pure calculations for portions and sides.
- Voice recording stops when backgrounded and retains a completed clip for explicit upload retry while the screen remains mounted. Video capture uses the website's 120-second limit. These lifecycle changes are implemented and type-checked, but remain unverified on hardware.
- Both native workout systems now use persisted rest deadlines with foreground refresh; expired timers show zero and skipped sets do not start a rest timer. The legacy screen exposes rest/skip controls and marks an exercise complete only when all its sets are done. Workout draft calculations live outside UI components. Pure timer and set-undo tests pass; hardware background behavior remains unverified.
- The Training tab now loads both active training systems concurrently, so a client with a current training plan and a legacy workout assignment can access both. Pull-to-refresh updates the plan, assignments, and any expanded video or history section together.
- Chat saves the full pending message and stable retry ID before the HTTP request, restores it per account/conversation, and requires explicit retry. The composer is locked while an attempt awaits confirmation; successful confirmation removes the pending attempt together with its saved composer drafts. Storage tests cover reopening, isolation, clearing, and missing retry IDs. Device process-kill and interrupted-network tests remain pending.
- Completed training sessions render recorded reps, weight, set feedback, difficulty, and overall feedback without exposing editable draft fields. Session completion clears its feedback draft only after server confirmation. Check-in saves and photo uploads now wait for draft restoration and remain disabled offline; pull-to-refresh covers daily, weekly, and insight resources.
- Assigned videos now have a native detail route for image or video playback, coach notes, instructions, tips, equipment, muscle groups, and completion. The assignment list renders thumbnails instead of creating a player for every row, reducing background media initialization on the Training screen.
- Profile uploads, feedback, push registration, and sign-out are explicitly unavailable offline. Feedback waits for its account-scoped draft to restore before submission. Privacy consent, export, session revocation, and deletion actions are also disabled offline while cached privacy data remains readable.
- Native notification enablement now registers the physical device and then enables message-notification consent as one user action from either Profile or Privacy. Registration or permission failure leaves consent disabled. Foreground notifications use a quiet banner/list presentation while active-chat presence still suppresses coach-message delivery. Hardware delivery remains unverified.
- Privacy now displays recent export status, current-session issue/expiry information, and any active deletion request with its scheduled date. A second deletion request cannot be submitted while one is active.
- Lunch and dinner now expose assigned side choices in the native plan. Selecting a side saves its linked meal assignment, matching the website and server data model. Side previews include image, type, origin, nutrition, ingredients, spices, and instructions. Meal previews now include image, macros, preparation time, servings, and explicit empty detail states. Meal options, selection, and adherence refresh together, and selection writes remain disabled offline.
- Native chat now scrolls to the latest message when a conversation opens or receives a new message. Fetching messages marks them read on the server and triggers conversation-list refresh so unread counts clear. Empty sends and uploads beyond five attachments are blocked before the request. Attachment actions wait for restored drafts, and an active voice recording can still be stopped after connectivity drops so the captured clip remains available for explicit retry.
- Check-ins now show daily completion, weekly submission status, a responsive 14-entry weight chart, recent measurements, trend, weekly completion, and streak. Chart projection handles missing and flat weight series and has pure unit coverage. Nutrition and training status controls are disabled offline because they submit immediately; the remaining form fields continue to persist as local drafts.
- Weekly check-ins now honor coach visibility for weight and progress photos both in the rendered form and in the submitted payload. Hidden values remain in the local draft but cannot be sent while disabled. Coach visibility updates invalidate the cached mobile dashboard summary immediately.
- Today now hides disabled nutrition, daily check-in, weekly check-in, and workout progress rows. Enabled weekly and training state are shown directly instead of reporting a disabled daily check-in as due.
- The current check-in schema has no coach-authored feedback field. Coach review endpoints only create private audit markers, so no feedback text or client-visible review state can be rendered without a future product/data-model change.

These checks exercise real Next.js/PostgreSQL and isolated native modules. They do not verify rendered native screens, media services, push delivery, or complete feature parity. All Device verified cells remain No. Actual media upload/playback, full meal/side/snack interaction parity, and populated-screen performance need further acceptance evidence. Both training systems still require native interaction and background-timer verification.

## Performance evidence

Latest local verification: the production build and all 15 backend unit tests pass. Real Next.js/PostgreSQL integration verifies the combined training count, client isolation, immediate coach-renamed plan visibility, current-session association, and incomplete-to-complete daily state with a one-day streak. The broader login, meals, videos, chat, workout, privacy, revocation, and deactivation checks also pass; synthetic fixtures were cleaned up.

The Today loader now reuses its 90-day check-in, nutrition, and training rows for today's state instead of issuing three additional reads. It uses UTC boundaries for stored date-only values and includes a narrow current-training-plan query, taking the top-level query groups from 14 to 12. This is a reduction in duplicate work, not a measured startup speed claim. Today now counts both training systems, prioritises an in-progress session, and routes current plans through Training. Coach plan/day changes invalidate the summary cache. Real-iPhone timing and a controlled before/after benchmark remain pending.

An early successful synthetic empty-account run measured the cold dashboard API at 1.35 seconds and warm requests at 114–274 ms from this Windows machine to the test database. There is no same-condition before/after baseline and no iPhone measurement. The two-second usable-screen target remains unverified. Per-run timings are written to ignored .cache/mobile/integration-results.json.
