import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import net from 'node:net';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

async function freePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  server.close();
  await once(server, 'close');
  return port;
}

test('Next.js health bridge reports backend health and safely degrades', { timeout: 45000 }, async () => {
  let mode = 'healthy';
  const backend = createServer((request, response) => {
    if (request.url !== '/api/v1/health') {
      response.writeHead(404).end();
      return;
    }
    response.setHeader('Content-Type', 'application/json');
    if (mode === 'unavailable') {
      response.writeHead(503).end(JSON.stringify({ status: 'unavailable' }));
    } else if (mode === 'invalid') {
      response.writeHead(200).end(JSON.stringify({ status: 'unexpected' }));
    } else {
      response.writeHead(200).end(JSON.stringify({ status: 'ok', service: 'renivet-backend' }));
    }
  });
  backend.listen(0, '127.0.0.1');
  await once(backend, 'listening');
  const backendPort = backend.address().port;
  const frontendPort = await freePort();

  const frontend = spawn(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'start', '-p', String(frontendPort), '-H', '127.0.0.1'],
    {
      env: {
        ...process.env,
        BACKEND_INTERNAL_URL: `http://127.0.0.1:${backendPort}/api/v1`,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let serverLog = '';
  for (const stream of [frontend.stdout, frontend.stderr]) {
    stream.on('data', (chunk) => { serverLog = (serverLog + chunk.toString()).slice(-4000); });
  }
  const endpoint = `http://127.0.0.1:${frontendPort}/api/health`;

  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (frontend.exitCode !== null) break;
      try {
        const response = await fetch(endpoint, { signal: AbortSignal.timeout(1000) });
        if (response.status === 200) {
          ready = true;
          assert.deepEqual(await response.json(), { status: 'ok', backend: 'ok' });
          break;
        }
      } catch { /* Next.js is still starting. */ }
      await delay(150);
    }
    assert.ok(ready, `Next.js failed to start. Last output:\n${serverLog}`);

    mode = 'unavailable';
    let response = await fetch(endpoint);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { status: 'unavailable', backend: 'unavailable' });

    mode = 'invalid';
    response = await fetch(endpoint);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { status: 'unavailable', backend: 'unavailable' });
  } finally {
    frontend.kill();
    backend.closeAllConnections();
    await new Promise((resolve) => backend.close(resolve));
  }
});
