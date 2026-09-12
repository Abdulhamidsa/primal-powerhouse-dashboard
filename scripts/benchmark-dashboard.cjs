const https = require('node:https');
const { performance } = require('node:perf_hooks');
const base = process.env.PRIMAL_TEST_API_URL;
const token = process.env.PRIMAL_TEST_ACCESS_TOKEN;
if (!base?.startsWith('https://') || !token) {
  console.error('Set PRIMAL_TEST_API_URL and PRIMAL_TEST_ACCESS_TOKEN for a synthetic staging client. Do not use production client credentials.');
  process.exitCode = 1;
} else {
  (async () => {
    const samples = [];
    for (let index = 0; index < 10; index++) {
      const start = performance.now();
      const result = await new Promise((resolve, reject) => {
        const req = https.get(new URL('/api/user/dashboard/summary', base), { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }, response => {
          let bytes = 0;
          response.on('data', chunk => { bytes += chunk.length; });
          response.on('end', () => resolve({ status: response.statusCode, bytes, serverTiming: response.headers['server-timing'] ?? null }));
        });
        req.on('timeout', () => req.destroy(new Error('timeout')));
        req.on('error', () => reject(new Error('Unable to reach test API. Details withheld.')));
      });
      if (result.status !== 200) throw new Error(`Test API returned ${result.status}; no client data printed.`);
      const ms = Math.round(performance.now() - start); samples.push(ms);
      console.log(JSON.stringify({ sample: index + 1, durationMs: ms, ...result }));
    }
    const sorted = [...samples].sort((a,b) => a-b);
    console.log(JSON.stringify({ firstRequestMs: samples[0], medianMs: sorted[5], p95Ms: sorted[9], note: 'First request is not necessarily a server cache miss. Compare timing logs and repeat from a cold staging cache.' }));
  })().catch(error => { console.error(error.message); process.exitCode = 1; });
}
