import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'

import { evaluateEvidence } from './run-contract.mjs'

// Pass this handler to a browser route interceptor before navigation. The
// caller must also save the browser's actual request events and render result.
export function getOnlyRouteGuard({ origin, routes, assetOrigins = [] }) {
  const allowed = new Set(routes)
  const requests = []
  const blockedRequests = []
  const handle = async (route) => {
    const request = route.request()
    const method = request.method().toUpperCase()
    const url = new URL(request.url())
    const path = url.pathname
    const reason = method !== 'GET' ? 'NON_GET' :
      url.origin !== origin && !assetOrigins.includes(url.origin) ? 'OTHER_ORIGIN' :
        path.startsWith('/admin') || path.startsWith('/api') ? 'ADMIN_OR_API' :
          url.origin === origin && !allowed.has(path) && !path.startsWith('/_next/') ? 'OUTSIDE_ROUTES' : null
    const item = { method, path, origin: url.origin }
    if (reason) {
      blockedRequests.push({ ...item, reason })
      await route.abort()
    } else {
      requests.push(item)
      await route.continue()
    }
  }
  return { handle, requests, blockedRequests }
}

export async function savePreviewQaCapture(destination, { deployment, browser, guard }) {
  const capture = { version: 1, capturedAt: new Date().toISOString(),
    deployment: { id: deployment.id, commit: deployment.commit, state: deployment.state },
    browser: { completed: browser.completed, rendered: browser.rendered,
      consoleErrors: browser.consoleErrors, runtimeErrors: browser.runtimeErrors,
      authEntry: browser.authEntry,
      routes: (browser.routes ?? []).map(({ path, viewport, rendered }) => ({ path, viewport, rendered })) },
    requests: guard.requests, blockedRequests: guard.blockedRequests }
  await writeFile(destination, `${JSON.stringify(capture, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
  return capture
}

export function previewQaDecision({ manifest, evidence, current, browser, deployment, requests, blockedRequests, routes,
  evidenceBytesVerified = false, browserCaptureVerified = false, viewports = ['desktop', 'mobile'] }) {
  const reasons = []
  if (!evidenceBytesVerified || !browserCaptureVerified) reasons.push('CAPTURE_SOURCE_UNVERIFIED')
  const dependency = evaluateEvidence(evidence, current, manifest)
  if (!dependency.valid) reasons.push(...dependency.changed.map((key) => `DEPENDENCY_${key.toUpperCase()}`))
  if (deployment?.commit !== current.commit || deployment?.id !== current.deployment) reasons.push('DEPLOYMENT_COMMIT_MISMATCH')
  if (deployment?.state !== 'READY') reasons.push('DEPLOYMENT_NOT_READY')
  if (!browser?.completed || !browser?.rendered || browser.consoleErrors !== 0 || browser.runtimeErrors !== 0) {
    reasons.push('BROWSER_RENDER_UNVERIFIED')
  }
  if (browser?.authEntry !== current.authEntry) reasons.push('AUTH_ENTRY_MISMATCH')
  if (!Array.isArray(browser?.routes) || browser.routes.length === 0 ||
      browser.routes.some((route) => !route.rendered || !['desktop', 'mobile'].includes(route.viewport)) ||
      !Array.isArray(routes) || routes.length === 0 ||
      routes.some((path) => viewports.some((viewport) =>
        !browser?.routes.some((route) => route.path === path && route.viewport === viewport && route.rendered)))) {
    reasons.push('ROUTE_RENDER_UNVERIFIED')
  }
  if (!Array.isArray(requests) || requests.length === 0 || requests.some((item) => item.method !== 'GET' ||
      item.path.startsWith('/admin') || item.path.startsWith('/api'))) reasons.push('GET_ONLY_UNVERIFIED')
  if (!Array.isArray(blockedRequests) || blockedRequests.some((item) => !item.reason)) reasons.push('BLOCKED_REQUEST_LOG_MISSING')
  else if (blockedRequests.length) reasons.push('BLOCKED_REQUESTS_OBSERVED')
  assert(evidence.kind === 'preview-qa', 'BLOCK: preview QA evidence kind')
  return { status: reasons.length ? 'BLOCK' : 'PASS', reasons, reused: reasons.length === 0,
    observedMethods: [...new Set((requests ?? []).map((item) => item.method))],
    blockedRequests: blockedRequests?.length ?? null }
}
