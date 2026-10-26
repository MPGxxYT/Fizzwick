// Serves dist/ with deploy/conf in the same nginx image the server runs, and
// fails unless it answers the way docs/deploy.md asks: no caching on sw.js
// and index.html, long caching on hashed assets, Riff links answered with
// the app, a missing asset answered with 404, and the manifest's type.
// Needs Docker and a build in dist/, so it runs in CI after the e2e tests.
//
// Usage: node scripts/check-server.mjs
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PORT = 8090
const NAME = 'fizzwick-check'
const IMAGE = readFileSync('deploy/compose.yaml', 'utf8').match(/^\s*image:\s*(\S+)/m)[1]

execFileSync('docker', [
  'run', '--detach', '--rm', '--name', NAME, '--publish', `${PORT}:80`,
  '--volume', `${resolve('dist')}:/usr/share/nginx/html:ro`,
  '--volume', `${resolve('deploy/conf')}:/etc/nginx/conf.d:ro`,
  IMAGE,
])

const failures = []
try {
  await waitForServer()
  const asset = readdirSync('dist/assets').find((name) => name.endsWith('.js'))

  await expect('/sw.js', 200, { 'cache-control': 'no-cache' })
  await expect('/', 200, { 'cache-control': 'no-cache' })
  await expect('/drinks/cherry-limeade/fizz=soda-water', 200, { 'cache-control': 'no-cache', 'content-type': 'text/html' })
  await expect(`/assets/${asset}`, 200, { 'cache-control': 'public, max-age=31536000, immutable' })
  await expect('/assets/missing.js', 404, {})
  await expect('/manifest.webmanifest', 200, { 'content-type': 'application/manifest+json' })
} finally {
  execFileSync('docker', ['stop', NAME])
}

if (failures.length > 0) {
  console.error(`The server config doesn't meet docs/deploy.md:\n  ${failures.join('\n  ')}`)
  process.exit(1)
}
console.log('The server config meets docs/deploy.md.')

async function expect(path, status, headers) {
  const response = await fetch(`http://localhost:${PORT}${path}`)
  if (response.status !== status) failures.push(`${path}: status ${response.status}, expected ${status}`)
  for (const [name, value] of Object.entries(headers)) {
    const actual = response.headers.get(name) ?? ''
    if (!actual.startsWith(value)) failures.push(`${path}: ${name} is "${actual}", expected "${value}"`)
  }
}

async function waitForServer() {
  for (let tries = 0; tries < 40; tries++) {
    try {
      await fetch(`http://localhost:${PORT}/`)
      return
    } catch {
      await new Promise((done) => setTimeout(done, 250))
    }
  }
  throw new Error('nginx did not start')
}
