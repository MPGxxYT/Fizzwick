/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

// Writes the service worker to the build as /sw.js, with the list of every
// file to precache: the bundle (which holds the House Drinks and Bar Terms),
// index.html, and everything in public/ (icons, manifest, photos). Its
// version is a hash of all of them, so any change makes a new service worker
// and the old cache is dropped.
function serviceWorker(): Plugin {
  let publicDir = ''
  return {
    name: 'fizzwick-service-worker',
    apply: 'build',
    configResolved(config) {
      publicDir = config.publicDir
    },
    writeBundle(options, bundle) {
      const outDir = options.dir!
      const publicFiles = publicDir ? filesIn(publicDir).map((path) => relative(publicDir, path)) : []
      const files = [...Object.keys(bundle), ...publicFiles]
        .map((name) => name.replaceAll('\\', '/'))
        // Source maps aren't needed offline, and every browser that runs a
        // service worker reads .woff2, so the older .woff fonts stay out.
        .filter((name) => !name.endsWith('.map') && !name.endsWith('.woff'))
        .sort()
      const hash = createHash('sha256')
      for (const name of files) hash.update(name).update(readFileSync(join(outDir, name)))
      const source = readFileSync('src/pwa/service-worker.js', 'utf8')
        .replace("'__VERSION__'", JSON.stringify(hash.digest('hex').slice(0, 12)))
        .replace('__PRECACHE__', JSON.stringify(files.map((name) => `/${name}`)))
      writeFileSync(join(outDir, 'sw.js'), source)
    },
  }
}

function filesIn(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesIn(join(dir, entry.name)) : [join(dir, entry.name)],
  )
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serviceWorker()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
