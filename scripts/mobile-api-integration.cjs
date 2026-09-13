// Real HTTP + PostgreSQL checks against temporary synthetic accounts only.
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const dotenv = require('dotenv');
const { assertDevelopmentDatabase } = require('./assert-development-database.cjs');

async function main() {
  const values = dotenv.parse(fs.readFileSync('.env.dev'));
  assertDevelopmentDatabase(values, dotenv.parse(fs.readFileSync('.env.prod')));
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient({ datasources: { db: { url: values.DIRECT_URL } } });
  const runId = crypto.randomUUID();
  const password = crypto.randomBytes(32).toString('base64url');
  const hash = await require('bcryptjs').hash(password, 10);
  const secret = crypto.randomBytes(48).toString('base64url');
  const env = { ...process.env };
  // Prevent Next's .env loader from enabling production external integrations.
  for (const file of fs.readdirSync('.').filter(name => name.startsWith('.env') && fs.statSync(name).isFile())) {
    for (const key of Object.keys(dotenv.parse(fs.readFileSync(file)))) env[key] = '';
  }
  Object.assign(env, {
    DATABASE_URL: values.DATABASE_URL,
    DIRECT_URL: values.DIRECT_URL,
    SHADOW_DATABASE_URL: values.SHADOW_DATABASE_URL,
    JWT_SECRET: secret,
    FIELD_ENCRYPTION_MASTER_KEY_BASE64: crypto.randomBytes(32).toString('base64'),
    FIELD_ENCRYPTION_KEY_VERSION: 'integration',
    NODE_ENV: 'production',
    PRIVACY_RECENT_AUTH_MAX_AGE_SECONDS: '900',
    PRIVACY_EXPORT_EXPIRY_HOURS: '24',
    PRIVACY_DELETION_GRACE_DAYS: '30',
    TZ: 'Europe/Copenhagen',
    NEXT_DIST_DIR: '.cache/mobile/next-build',
    NEXT_TSCONFIG_PATH: '.cache/mobile/tsconfig.next-build.json',
    NEXT_TELEMETRY_DISABLED: '1',
  });
  const probe = net.createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  fs.mkdirSync('.cache/mobile', { recursive: true });
  const log = fs.openSync('.cache/mobile/integration-server.log', 'w');
  const server = spawn(
    process.execPath,
    [require.resolve('next/dist/bin/next'), 'start', '-H', '127.0.0.1', '-p', String(port)],
    { env, stdio: ['ignore', log, log], windowsHide: true },
  );
  let coach;
  const clients = [];
  const timings = [];
  function request(path, { method = 'GET', body, token, cookie } = {}) {
    return new Promise((resolve, reject) => {
      const started = performance.now();
      const content = body === undefined ? undefined : JSON.stringify(body);
      const headers = {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(cookie ? { cookie, origin: `http://127.0.0.1:${port}`, 'x-forwarded-proto': 'http' } : {}),
        ...(content ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(content) } : {}),
      };
      const req = http.request({ host: '127.0.0.1', port, path, method, headers, timeout: 30000 }, response => {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => {
          const text = Buffer.concat(chunks).toString();
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            data = null;
          }
          resolve({
            status: response.statusCode,
            data,
            headers: response.headers,
            ms: Math.round(performance.now() - started),
          });
        });
      });
      req.on('error', reject);
      req.on('timeout', () => req.destroy(new Error('HTTP timeout')));
      req.end(content);
    });
  }
  async function expectStatus(path, options, status = 200) {
    const result = await request(path, options);
    assert.equal(result.status, status, `${options?.method || 'GET'} ${path.split('?')[0]}: unexpected HTTP status`);
    return result;
  }
  try {
    let ready = false;
    for (let attempt = 0; attempt < 90; attempt++) {
      try {
        await request('/api/auth/mobile/login', { method: 'POST', body: {} });
        ready = true;
        break;
      } catch {}
      if (server.exitCode !== null) throw new Error('Integration server exited');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    assert.ok(ready, 'Integration server did not start');
    coach = await db.user.create({
      data: { email: `mobile-coach-${runId}@example.test`, name: 'Synthetic Mobile Coach', password: hash },
    });
    for (const label of ['a', 'b'])
      clients.push(
        await db.client.create({
          data: {
            email: `mobile-${label}-${runId}@example.test`,
            name: `Synthetic Mobile ${label}`,
            password: hash,
            coachId: coach.id,
          },
        }),
      );
    const login = async client =>
      (await expectStatus('/api/auth/mobile/login', { method: 'POST', body: { email: client.email, password } })).data;
    let session = await login(clients[0]);
    const other = await login(clients[1]);
    assert.equal(session.user.id, clients[0].id);
    await expectStatus(
      '/api/auth/mobile/login',
      { method: 'POST', body: { email: clients[0].email, password: 'wrong-password' } },
      401,
    );
    const web = await expectStatus('/api/auth/user/login', {
      method: 'POST',
      body: { email: clients[0].email, password },
    });
    const cookie = web.headers['set-cookie'].map(item => item.split(';')[0]).join('; ');
    const initialSummary = await expectStatus('/api/user/dashboard/summary', { cookie });
    timings.push({
      path: '/api/user/dashboard/summary',
      kind: 'cold browser request',
      milliseconds: initialSummary.ms,
      serverTiming: initialSummary.headers['server-timing'] || null,
    });
    const week = initialSummary.data.weeklyCheckIn.weekStartDate;
    for (const path of [
      '/api/user/dashboard/summary',
      '/api/user/dashboard/summary',
      '/api/user/meals/options',
      '/api/user/meals/selection',
      '/api/user/adherence/current',
      '/api/user/daily-checkins/current',
      '/api/user/daily-checkins/insights',
      `/api/user/weekly-checkins/current?weekStartDate=${week}`,
      '/api/user/training/plan',
      '/api/user/training/history',
      '/api/user/workout-assignments',
      '/api/user/videos',
      '/api/user/coach',
      '/api/privacy/center',
    ]) {
      const result = await expectStatus(
        path,
        { token: session.accessToken },
        path === '/api/user/training/plan' ? 404 : 200,
      );
      timings.push({ path, milliseconds: result.ms, serverTiming: result.headers['server-timing'] || null });
    }
    console.log('PASS: mobile login, existing browser login, and 14 client API reads');
    const coachLogin = await expectStatus('/api/auth/admin/login', {
      method: 'POST',
      body: { email: coach.email, password },
    });
    const coachCookie = coachLogin.headers['set-cookie'].map(item => item.split(';')[0]).join('; ');
    await expectStatus(`/api/clients/${clients[0].id}/feature-visibility`, {
      method: 'PUT',
      cookie: coachCookie,
      body: { weightChartEnabled: false, progressPhotosEnabled: false },
    });
    const hiddenFeatureSummary = await expectStatus('/api/user/dashboard/summary', {
      token: session.accessToken,
    });
    assert.equal(hiddenFeatureSummary.data.featureVisibility.weightChartEnabled, false);
    assert.equal(hiddenFeatureSummary.data.featureVisibility.progressPhotosEnabled, false);
    await expectStatus(`/api/clients/${clients[0].id}/feature-visibility`, {
      method: 'PUT',
      cookie: coachCookie,
      body: { weightChartEnabled: true, progressPhotosEnabled: true },
    });
    const restoredFeatureSummary = await expectStatus('/api/user/dashboard/summary', {
      token: session.accessToken,
    });
    assert.equal(restoredFeatureSummary.data.featureVisibility.weightChartEnabled, true);
    assert.equal(restoredFeatureSummary.data.featureVisibility.progressPhotosEnabled, true);
    console.log('PASS: coach feature changes invalidate the mobile dashboard summary immediately');
    const conversation = (await expectStatus('/api/conversations', { token: session.accessToken })).data.items[0];
    assert.ok(conversation, 'Assigned-coach conversation should be provisioned for the client');
    const messagePath = `/api/conversations/${conversation.id}/messages`;
    const clientMessage = { body: 'Synthetic client message', attachments: [], clientTempId: `${runId}-client` };
    const sent = await expectStatus(
      messagePath,
      { method: 'POST', token: session.accessToken, body: clientMessage },
      201,
    );
    const retried = await expectStatus(messagePath, {
      method: 'POST',
      token: session.accessToken,
      body: clientMessage,
    });
    assert.equal(sent.data.id, retried.data.id);
    await expectStatus(
      messagePath,
      {
        method: 'POST',
        cookie: coachCookie,
        body: { body: 'Synthetic coach reply', attachments: [], clientTempId: `${runId}-coach` },
      },
      201,
    );
    await expectStatus(messagePath, { token: other.accessToken }, 403);
    assert.equal((await expectStatus(messagePath, { token: session.accessToken })).data.items.length, 2);
    assert.equal((await expectStatus(messagePath, { cookie: coachCookie })).data.items.length, 2);
    console.log('PASS: coach/client text chat in both directions, retry deduplication, and conversation isolation');
    await require('./mobile-meals-integration.cjs')({ db, coach, clients, session, other, expectStatus });
    const video = await db.video.create({
      data: {
        title: 'Synthetic exercise',
        coachId: coach.id,
        category: 'STRENGTH_TRAINING',
        difficulty: 'BEGINNER',
        duration: 30,
        videoUrl: 'https://example.test/synthetic.mp4',
      },
    });
    const assignedVideo = await db.videoAssignment.create({ data: { clientId: clients[0].id, videoId: video.id } });
    const secondVideoAssignment = await db.videoAssignment.create({ data: { clientId: clients[0].id, videoId: video.id } });
    await expectStatus(`/api/user/videos/${assignedVideo.id}`, { token: session.accessToken });
    await expectStatus(`/api/user/videos/${assignedVideo.id}`, { token: other.accessToken }, 404);
    await expectStatus(`/api/user/videos/${assignedVideo.id}/complete`, { method: 'POST', token: other.accessToken }, 404);
    await expectStatus(`/api/user/videos/${assignedVideo.id}/complete`, { method: 'POST', token: session.accessToken });
    await expectStatus(`/api/user/videos/${assignedVideo.id}/complete`, { method: 'POST', token: session.accessToken });
    assert.equal((await db.videoAssignment.findUnique({ where: { id: assignedVideo.id } })).isCompleted, true);
    assert.equal((await db.videoAssignment.findUnique({ where: { id: secondVideoAssignment.id } })).isCompleted, false);
    console.log('PASS: assigned video details and completion are restricted to the client and chosen assignment');
    const plan = (
      await expectStatus(
        '/api/admin/workout-plans',
        {
          method: 'POST',
          cookie: coachCookie,
          body: {
            name: 'Synthetic mobile workout',
            exercises: [{ videoId: video.id, targetSets: 1, minReps: 8, maxReps: 12, restSeconds: 30 }],
          },
        },
        201,
      )
    ).data;
    const assigned = (
      await expectStatus(
        '/api/admin/workout-plans/assignments',
        { method: 'POST', cookie: coachCookie, body: { workoutPlanId: plan.id, clientId: clients[0].id } },
        201,
      )
    ).data;
    const assignments = (await expectStatus('/api/user/workout-assignments', { token: session.accessToken })).data;
    assert.ok(assignments.some(item => item.id === assigned.id));
    assert.equal((await expectStatus('/api/user/workout-assignments', { token: other.accessToken })).data.length, 0);
    const start = { method: 'POST', token: session.accessToken, body: { planAssignmentId: assigned.id, resume: true } };
    const first = (await expectStatus('/api/user/workout-sessions', start)).data;
    const resumed = await request('/api/user/workout-sessions', start);
    assert.ok([200, 201].includes(resumed.status));
    assert.equal(first.id, resumed.data.id);
    const finish = {
      status: 'COMPLETED',
      exerciseLogs: [
        {
          planExerciseId: assignments[0].workoutPlan.exercises[0].id,
          completedAt: new Date().toISOString(),
          feedback: 'FELT_GOOD',
          sets: [{ reps: 10, weightKg: 5, completed: true }],
        },
      ],
    };
    await expectStatus(`/api/user/workout-sessions/${first.id}`, {
      method: 'PATCH',
      token: session.accessToken,
      body: finish,
    });
    await expectStatus(`/api/user/workout-sessions/${first.id}`, {
      method: 'PATCH',
      token: session.accessToken,
      body: finish,
    });
    assert.equal(await db.exerciseLog.count({ where: { sessionId: first.id } }), 1);
    assert.equal((await db.workoutSession.findUnique({ where: { id: first.id } })).status, 'COMPLETED');
    console.log('PASS: website workout assignment reaches mobile; resume and completion retries preserve history');
    const exercise = (
      await expectStatus(
        '/api/admin/training/exercises',
        { method: 'POST', cookie: coachCookie, body: { name: 'Synthetic squat', muscleGroup: 'LEGS' } },
        201,
      )
    ).data;
    const template = (
      await expectStatus(
        '/api/admin/training/templates',
        {
          method: 'POST',
          cookie: coachCookie,
          body: {
            name: 'Synthetic strength day',
            exercises: [{ exerciseId: exercise.id, order: 0, sets: 1, reps: 8, restSeconds: 30 }],
          },
        },
        201,
      )
    ).data;
    const trainingPlan = (
      await expectStatus(
        '/api/admin/training/plans',
        {
          method: 'POST',
          cookie: coachCookie,
          body: { name: 'Synthetic training plan', clientId: clients[0].id, startDate: new Date().toISOString() },
        },
        201,
      )
    ).data;
    const trainingDay = (
      await expectStatus(
        `/api/admin/training/plans/${trainingPlan.id}/days`,
        {
          method: 'POST',
          cookie: coachCookie,
          body: { date: new Date().toISOString(), workoutTemplateId: template.id },
        },
        201,
      )
    ).data;
    const combinedSummary = (await expectStatus('/api/user/dashboard/summary', { token: session.accessToken })).data;
    assert.equal(combinedSummary.training.activeAssignmentCount, 2);
    assert.equal(combinedSummary.training.activePlanName, trainingPlan.name);
    assert.equal(combinedSummary.training.activeAssignmentId, null);
    assert.equal(
      (await expectStatus('/api/user/dashboard/summary', { token: other.accessToken })).data.training.activeAssignmentCount,
      0,
    );
    await expectStatus(`/api/admin/training/plans/${trainingPlan.id}`, {
      method: 'PATCH', cookie: coachCookie, body: { name: 'Updated synthetic training plan' },
    });
    assert.equal(
      (await expectStatus('/api/user/dashboard/summary', { token: session.accessToken })).data.training.activePlanName,
      'Updated synthetic training plan',
    );
    assert.equal(
      (await expectStatus('/api/user/training/plan', { token: session.accessToken })).data.id,
      trainingPlan.id,
    );
    const trainingStart = { method: 'POST', token: session.accessToken, body: { planDayId: trainingDay.id } };
    const training = (await expectStatus('/api/user/training/sessions', trainingStart, 201)).data;
    const resumedSummary = (await expectStatus('/api/user/dashboard/summary', { token: session.accessToken })).data;
    assert.equal(resumedSummary.training.activeSessionId, training.id);
    assert.equal(resumedSummary.pendingAttention.items.find(item => item.kind === 'training').href, '/user/training');
    assert.equal((await expectStatus('/api/user/training/sessions', trainingStart, 201)).data.id, training.id);
    const setId = training.exercises[0].sets[0].id;
    const setBody = { actualReps: 8, actualWeightKg: 20, completed: true, feedback: 'Synthetic set feedback' };
    await expectStatus(
      `/api/user/training/sessions/${training.id}/sets/${setId}`,
      { method: 'PATCH', token: other.accessToken, body: setBody },
      403,
    );
    await expectStatus(
      `/api/user/training/sessions/${training.id}/sets/not-in-this-session`,
      { method: 'PATCH', token: session.accessToken, body: setBody },
      400,
    );
    await expectStatus(`/api/user/training/sessions/${training.id}/sets/${setId}`, {
      method: 'PATCH',
      token: session.accessToken,
      body: setBody,
    });
    await expectStatus(`/api/user/training/sessions/${training.id}`, {
      method: 'PATCH',
      token: session.accessToken,
      body: {
        status: 'COMPLETED',
        perceivedDifficulty: 'GOOD',
        overallFeedback: 'Synthetic session feedback',
        caloriesBurned: 100,
      },
    });
    const completedTraining = await db.trainingSession.findUnique({ where: { id: training.id } });
    assert.equal(completedTraining.overallFeedback, 'Synthetic session feedback');
    assert.equal(completedTraining.perceivedDifficulty, 'GOOD');
    assert.equal(completedTraining.caloriesBurned, 100);
    console.log('PASS: website training plan reaches mobile; resume, set ownership, and session feedback persist');
    const oldRefresh = session.refreshToken;
    session = (await expectStatus('/api/auth/mobile/refresh', { method: 'POST', body: { refreshToken: oldRefresh } }))
      .data;
    assert.notEqual(session.refreshToken, oldRefresh);
    await expectStatus('/api/auth/mobile/refresh', { method: 'POST', body: { refreshToken: oldRefresh } }, 401);
    const jwt = require('jsonwebtoken');
    const claims = jwt.decode(session.accessToken);
    const expired = jwt.sign(
      { userId: clients[0].id, email: clients[0].email, type: 'client', sid: claims.sid },
      secret,
      { audience: 'primal-mobile', expiresIn: -1 },
    );
    await expectStatus('/api/user/dashboard/summary', { token: expired }, 401);
    console.log('PASS: refresh rotation, replay rejection, and access expiry');
    const day = (await expectStatus('/api/user/daily-checkins/current', { token: session.accessToken })).data.dayDate;
    const body = {
      dayDate: day,
      payload: { weightKg: 80.5, energy: 'NORMAL', note: 'Synthetic integration check-in' },
    };
    await expectStatus('/api/user/daily-checkins/current', { method: 'PUT', token: session.accessToken, body });
    await expectStatus('/api/user/daily-checkins/current', { method: 'PUT', token: session.accessToken, body });
    assert.equal(await db.dailyCheckIn.count({ where: { clientId: clients[0].id } }), 1);
    const savedCheckIn = (await expectStatus('/api/user/daily-checkins/current', { token: session.accessToken })).data;
    const savedSummary = (await expectStatus('/api/user/dashboard/summary', { token: session.accessToken })).data;
    assert.equal(savedSummary.dailyCheckIn.isComplete, savedCheckIn.entry.isComplete);
    assert.equal(savedSummary.dailyCheckIn.dayDate, day);
    assert.equal(savedSummary.dailyCheckIn.isComplete, false);
    await expectStatus('/api/user/daily-checkins/current', {
      method: 'PUT', token: session.accessToken,
      body: { dayDate: day, payload: { hunger: 'SATISFIED', sleep: 'GOOD' } },
    });
    await expectStatus('/api/user/daily-nutrition/current', {
      method: 'PUT', token: session.accessToken, body: { dayDate: day, status: 'ON_PLAN' },
    });
    await expectStatus('/api/user/daily-training/current', {
      method: 'PUT', token: session.accessToken, body: { dayDate: day, status: 'DONE' },
    });
    const completeSummary = (await expectStatus('/api/user/dashboard/summary', { token: session.accessToken })).data;
    assert.equal(completeSummary.dailyCheckIn.isComplete, true);
    assert.equal(completeSummary.dailyCheckIn.nutritionStatus, 'ON_PLAN');
    assert.equal(completeSummary.dailyCheckIn.trainingStatus, 'DONE');
    assert.equal(completeSummary.streakCount, 1);
    assert.equal(
      (await expectStatus('/api/user/daily-checkins/current', { token: other.accessToken })).data.entry,
      null,
    );
    await expectStatus('/api/privacy/consent', {
      method: 'PUT',
      token: session.accessToken,
      body: { analytics: false, marketingNotifications: false, optionalTracking: false, messageNotifications: false },
    });
    console.log('PASS: native mutations, retry-safe check-ins, and client data isolation');
    await db.mobileSession.update({
      where: { id: claims.sid },
      data: { authenticatedAt: new Date(Date.now() - 3600000) },
    });
    session = (
      await expectStatus('/api/auth/mobile/refresh', { method: 'POST', body: { refreshToken: session.refreshToken } })
    ).data;
    await expectStatus('/api/privacy/export', { method: 'POST', token: session.accessToken, body: {} }, 401);
    await expectStatus('/api/auth/mobile/reauthenticate', {
      method: 'POST',
      token: session.accessToken,
      body: { password },
    });
    const exported = (
      await expectStatus('/api/privacy/export', { method: 'POST', token: session.accessToken, body: {} })
    ).data;
    await expectStatus(exported.downloadUrl, { token: other.accessToken }, 404);
    await expectStatus(exported.downloadUrl, { token: session.accessToken });
    console.log('PASS: refresh cannot bypass password verification; private export ownership enforced');
    await expectStatus('/api/privacy/sessions', {
      method: 'POST',
      token: session.accessToken,
      body: { action: 'logout_all' },
    });
    await expectStatus('/api/user/dashboard/summary', { token: session.accessToken }, 401);
    await expectStatus('/api/user/dashboard/summary', { cookie }, 401);
    await expectStatus(
      '/api/auth/mobile/refresh',
      { method: 'POST', body: { refreshToken: session.refreshToken } },
      401,
    );
    await expectStatus('/api/user/dashboard/summary', { token: other.accessToken });
    const finalSession = await login(clients[0]);
    await expectStatus('/api/auth/mobile/logout', {
      method: 'POST',
      body: { refreshToken: finalSession.refreshToken },
    });
    await expectStatus('/api/user/dashboard/summary', { token: finalSession.accessToken }, 401);
    await db.client.update({ where: { id: clients[1].id }, data: { status: 'INACTIVE' } });
    await expectStatus('/api/user/dashboard/summary', { token: other.accessToken }, 401);
    await expectStatus('/api/auth/mobile/refresh', { method: 'POST', body: { refreshToken: other.refreshToken } }, 401);
    console.log('PASS: logout, logout-all across browser/mobile, and account deactivation');
    fs.writeFileSync(
      '.cache/mobile/integration-results.json',
      JSON.stringify(
        {
          recordedAt: new Date().toISOString(),
          fixture: 'Synthetic accounts with no meal/training assignments; API timings only, not device startup',
          timings,
        },
        null,
        2,
      ),
    );
  } finally {
    server.kill();
    fs.closeSync(log);
    if (clients.length)
      await db.auditLog.deleteMany({ where: { targetUserId: { in: clients.map(client => client.id) } } });
    if (coach) {
      // Remove template links before the coach cascade reaches exercises whose
      // template references use ON DELETE RESTRICT.
      await db.workoutTemplate.deleteMany({ where: { coachId: coach.id } });
      await db.user.delete({ where: { id: coach.id } });
    }
    await db.$disconnect();
    console.log('Temporary synthetic fixtures cleaned up.');
  }
}
main().catch(error => {
  console.error(`Integration error category: ${error.name || 'Error'}; code: ${error.code || 'unspecified'}`);
  console.error(
    error.code === 'ERR_ASSERTION'
      ? error.message
      : 'Integration check failed; inspect the local integration log. Credentials withheld.',
  );
  process.exitCode = 1;
});
