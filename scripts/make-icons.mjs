// Renders public/icons/icon.svg to the PNG sizes phones need, using the
// Playwright Chromium already installed for the e2e tests. Run it again after
// changing the SVG: node scripts/make-icons.mjs
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

const svg = readFileSync('public/icons/icon.svg', 'utf8')
const SIZES = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
]

const browser = await chromium.launch()
for (const [name, size] of SIZES) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.setContent(
    `<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  )
  await page.screenshot({ path: `public/icons/${name}` })
  await page.close()
  console.log(`public/icons/${name}`)
}
await browser.close()
