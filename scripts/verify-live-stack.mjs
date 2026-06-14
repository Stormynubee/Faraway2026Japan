#!/usr/bin/env node
/**
 * Post-deploy smoke check for split Vercel frontend + hosted FastAPI backend.
 *
 * Usage:
 *   node scripts/verify-live-stack.mjs https://bogie-flow.onrender.com
 *   LIVE_BACKEND_URL=https://... node scripts/verify-live-stack.mjs
 */

const backend = (process.argv[2] || process.env.LIVE_BACKEND_URL || '').replace(/\/$/, '')
const vercelOrigin = process.env.LIVE_VERCEL_ORIGIN || 'https://bogieflow.vercel.app'
const frontend = process.env.LIVE_FRONTEND_URL || 'https://bogieflow.vercel.app'

if (!backend) {
  console.error('Usage: node scripts/verify-live-stack.mjs <BACKEND_URL>')
  process.exit(1)
}

function fail(label, detail) {
  console.error(`FAIL ${label}: ${detail}`)
  process.exitCode = 1
}

function pass(label) {
  console.log(`OK   ${label}`)
}

async function main() {
  console.log(`Backend:  ${backend}`)
  console.log(`Frontend: ${frontend}`)
  console.log(`Origin:   ${vercelOrigin}`)
  console.log('')

  try {
    const health = await fetch(`${backend}/api/health`, { signal: AbortSignal.timeout(60_000) })
    if (!health.ok) fail('health', `${health.status} ${health.statusText}`)
    else {
      const body = await health.json()
      if (body.segments !== 6) fail('health', `expected 6 segments, got ${body.segments}`)
      else pass('GET /api/health')
    }
  } catch (err) {
    fail('health', err.message)
  }

  try {
    const cors = await fetch(`${backend}/api/health`, {
      headers: { Origin: vercelOrigin },
      signal: AbortSignal.timeout(60_000),
    })
    const allow = cors.headers.get('access-control-allow-origin')
    if (allow !== vercelOrigin) fail('cors', `expected ${vercelOrigin}, got ${allow}`)
    else pass('CORS for Vercel origin')
  } catch (err) {
    fail('cors', err.message)
  }

  try {
    const page = await fetch(frontend, { signal: AbortSignal.timeout(30_000) })
    if (!page.ok) fail('frontend', `${page.status} ${page.statusText}`)
    else {
      const html = await page.text()
      if (!html.includes('index-') && !html.includes('/assets/')) {
        fail('frontend', 'missing Vite asset references')
      } else pass(`GET ${frontend}`)
    }
  } catch (err) {
    fail('frontend', err.message)
  }

  try {
    const bundleMatch = (await fetch(frontend, { signal: AbortSignal.timeout(30_000) })).text()
    const html = await bundleMatch
    const jsMatch = html.match(/\/assets\/index-[^"]+\.js/)
    if (!jsMatch) fail('bundle', 'could not find main JS bundle')
    else {
      const js = await fetch(`${frontend}${jsMatch[0]}`, { signal: AbortSignal.timeout(30_000) })
      const source = await js.text()
      if (!source.includes(backend.replace('https://', ''))) {
        fail('bundle', `VITE_API_BASE not baked into production bundle (expected ${backend})`)
      } else pass('VITE_API_BASE embedded in frontend bundle')
    }
  } catch (err) {
    fail('bundle', err.message)
  }

  if (process.exitCode) process.exit(process.exitCode)
  console.log('\nLive stack verification passed.')
}

main()
