// Fails if a House Spec photo is over budget. Photos are precached for
// offline use, so each one may be at most 100 KB. A photo that isn't in
// public/ yet is listed but doesn't fail: the app shows the glass drawing
// until it's added.
//
// Usage: node scripts/check-photos.mjs
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'src/house-drinks'
const BUDGET_BYTES = 100 * 1024

const drinks = readdirSync(DIR)
  .filter((name) => name.endsWith('.json'))
  .map((name) => JSON.parse(readFileSync(join(DIR, name), 'utf8')))

const over = []
const missing = []
for (const drink of drinks) {
  const path = join('public', drink.photo)
  if (!existsSync(path)) missing.push(path)
  else if (statSync(path).size > BUDGET_BYTES) over.push(`${path}: ${Math.round(statSync(path).size / 1024)} KB`)
}

if (missing.length > 0) console.log(`No photo yet (the glass drawing shows instead):\n  ${missing.join('\n  ')}`)
if (over.length > 0) {
  console.error(`These House Spec photos are over ${BUDGET_BYTES / 1024} KB:\n  ${over.join('\n  ')}`)
  process.exit(1)
}
console.log(`Every House Spec photo is within ${BUDGET_BYTES / 1024} KB.`)
