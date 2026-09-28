#!/usr/bin/env node

// ==============================================================================
// BIS Intelligent Platform — Staging Smoke Test Suite
// Non-Destructive Post-Deployment Verification Probes
// Usage: node scripts/staging-smoke-test.mjs
// Environment Variables:
//   STAGING_API_URL: Base API URL (e.g. https://staging-api.bis-intelligent.gov.in/api/v1)
//   STAGING_WEB_URL: Base Web URL (e.g. https://staging.bis-intelligent.gov.in)
// ==============================================================================

const API_BASE = (process.env.STAGING_API_URL || 'http://localhost:5000/api/v1').replace(/\/+$/, '');
const WEB_BASE = (process.env.STAGING_WEB_URL || 'http://localhost:5173').replace(/\/+$/, '');

let passedCount = 0;
let failedCount = 0;
const results = [];

function log(msg) {
  console.log(msg);
}

function recordResult(testName, passed, details = '') {
  if (passed) {
    passedCount++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${testName} ${details ? `(${details})` : ''}`);
  } else {
    failedCount++;
    console.log(`  \x1b[31m✖ FAIL\x1b[0m ${testName} ${details ? `— ${details}` : ''}`);
  }
  results.push({ testName, passed, details });
}

async function runSmokeTests() {
  log('\n======================================================================');
  log(' BIS INTELLIGENT PLATFORM — STAGING SMOKE TEST SUITE');
  log(` Target API: ${API_BASE}`);
  log(` Target Web: ${WEB_BASE}`);
  log('======================================================================\n');

  // ───────────────────────────────────────────────────────────────────────────
  // 1. API Liveness Probe
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const liveUrl = `${API_BASE}/health/live`;
    const res = await fetch(liveUrl, { method: 'GET', signal: AbortSignal.timeout(5000) });
    const json = await res.json().catch(() => ({}));
    const ok = res.status === 200 && (json.success === true || json.status === 'ok') && (json.data?.status === 'healthy' || json.data?.status === 'live');
    recordResult('API Liveness Probe (/health/live)', ok, `HTTP ${res.status}, status: ${json.data?.status}`);
  } catch (err) {
    recordResult('API Liveness Probe (/health/live)', false, `Connection error: ${err.message}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. API Readiness Probe (Database Connectivity Verification)
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const readyUrl = `${API_BASE}/health/ready`;
    const res = await fetch(readyUrl, { method: 'GET', signal: AbortSignal.timeout(8000) });
    const json = await res.json().catch(() => ({}));
    const dbConnected = json.data?.database?.status === 'connected' || json.data?.services?.database === 'connected';
    const ok = res.status === 200 && (json.success === true || json.status === 'ok') && dbConnected;
    
    // Security check: ensure no database connection strings or passwords leaked in response
    const rawText = JSON.stringify(json);
    const leakedSecret = rawText.includes('password') || rawText.includes('postgres://') || rawText.includes('postgresql://');
    
    recordResult(
      'API Readiness Probe (/health/ready)',
      ok && !leakedSecret,
      ok ? (leakedSecret ? 'FAILED (Database URL or password leaked in payload!)' : 'DB connected, zero credentials exposed') : `HTTP ${res.status}`
    );
  } catch (err) {
    recordResult('API Readiness Probe (/health/ready)', false, `Connection error: ${err.message}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Web Frontend Ingress Probe
  // ───────────────────────────────────────────────────────────────────────────
  try {
    let webOk = false;
    let webDetail = '';

    // Try /healthz first (Nginx health endpoint)
    try {
      const resZ = await fetch(`${WEB_BASE}/healthz`, { method: 'GET', signal: AbortSignal.timeout(3000) });
      if (resZ.status === 200) {
        webOk = true;
        webDetail = 'Nginx /healthz 200 OK';
      }
    } catch {
      // Expected if testing against Vite dev server
    }

    if (!webOk) {
      const resRoot = await fetch(`${WEB_BASE}/`, { method: 'GET', signal: AbortSignal.timeout(5000) });
      const text = await resRoot.text().catch(() => '');
      if (resRoot.status === 200 && (text.includes('root') || text.includes('html') || text.includes('BIS'))) {
        webOk = true;
        webDetail = `Frontend SPA responding (HTTP ${resRoot.status})`;
      } else {
        webDetail = `HTTP ${resRoot.status}`;
      }
    }

    recordResult('Web Frontend Ingress Probe', webOk, webDetail);
  } catch (err) {
    recordResult('Web Frontend Ingress Probe', false, `Connection error: ${err.message}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Public Citizen Services Catalog Query
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${API_BASE}/consumer/services`, { method: 'GET', signal: AbortSignal.timeout(5000) });
    const json = await res.json().catch(() => ({}));
    const services = json.data?.services;
    const ok = res.status === 200 && json.success === true && Array.isArray(services) && services.length > 0;
    recordResult('Citizen Services Catalog (/consumer/services)', ok, ok ? `Returned ${services.length} services` : `HTTP ${res.status}`);
  } catch (err) {
    recordResult('Citizen Services Catalog (/consumer/services)', false, `Error: ${err.message}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Official Licence Verification Boundary
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${API_BASE}/consumer/licence/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenceNumber: 'CM/L-1234567' }),
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json().catch(() => ({}));
    const verification = json.data?.verification;
    const ok = res.status === 200 && json.success === true && verification?.status === 'VERIFIED';
    recordResult('Licence Verification Boundary (/consumer/licence/verify)', ok, ok ? `Manufacturer: ${verification.manufacturer}, Status: ${verification.status}` : `HTTP ${res.status}`);
  } catch (err) {
    recordResult('Licence Verification Boundary (/consumer/licence/verify)', false, `Error: ${err.message}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 6. RBAC & Security Boundary (Protected Route Access Protection)
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${API_BASE}/admin/overview`, { method: 'GET', signal: AbortSignal.timeout(5000) });
    // Must reject unauthenticated access with 401 Unauthorized or 403 Forbidden
    const ok = res.status === 401 || res.status === 403;
    recordResult('RBAC Boundary Protection (/admin/overview)', ok, `Blocked with HTTP ${res.status} as expected`);
  } catch (err) {
    recordResult('RBAC Boundary Protection (/admin/overview)', false, `Error: ${err.message}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Production Error Masking & Stack Trace Sanitization
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${API_BASE}/non-existent-route-for-smoke-test`, { method: 'GET', signal: AbortSignal.timeout(5000) });
    const json = await res.json().catch(() => ({}));
    const ok = res.status === 404 && (!json.stack || process.env.NODE_ENV !== 'production');
    recordResult('Error Sanitization (404 Route)', ok, `HTTP ${res.status}, stack trace omitted: ${!json.stack}`);
  } catch (err) {
    recordResult('Error Sanitization (404 Route)', false, `Error: ${err.message}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Summary & Exit
  // ───────────────────────────────────────────────────────────────────────────
  log('\n----------------------------------------------------------------------');
  log(` Smoke Test Summary: ${passedCount} passed, ${failedCount} failed of ${results.length} tests`);
  log('----------------------------------------------------------------------\n');

  if (failedCount > 0) {
    console.error('\x1b[31mOne or more staging smoke tests failed.\x1b[0m');
    process.exit(1);
  } else {
    console.log('\x1b[32mAll staging smoke tests passed successfully.\x1b[0m');
    process.exit(0);
  }
}

runSmokeTests().catch((err) => {
  console.error('Unhandled smoke test error:', err);
  process.exit(1);
});
