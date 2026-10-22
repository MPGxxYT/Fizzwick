// Fails if a Drink, Slot or Option ID in the House Drink files at a base
// commit is missing from the working tree. Favorites and Riff links refer
// to these IDs, so they must never disappear (ADR 0001).
//
// Usage: node scripts/check-drink-ids.mjs [base-ref]   (default: origin/main)
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'src/house-drinks'
const NO_COMMIT = /^0+$/

const arg = process.argv[2]
const base = arg && !NO_COMMIT.test(arg) ? arg : 'origin/main'

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
}

function idsOf(drink) {
  const ids = [drink.id]
  for (const slot of drink.slots ?? []) {
    ids.push(`${drink.id}/${slot.id}`)
    for (const option of slot.options ?? []) ids.push(`${drink.id}/${slot.id}/${option.id}`)
  }
  return ids
}

function baseIds() {
  let listing
  try {
    listing = git('ls-tree', '--name-only', `${base}:${DIR}`)
  } catch {
    return [] // No House Drinks at the base commit yet.
  }
  return listing
    .split('\n')
    .filter((name) => name.endsWith('.json'))
    .flatMap((name) => idsOf(JSON.parse(git('show', `${base}:${DIR}/${name}`))))
}

function currentIds() {
  return readdirSync(DIR)
    .filter((name) => name.endsWith('.json'))
    .flatMap((name) => idsOf(JSON.parse(readFileSync(join(DIR, name), 'utf8'))))
}

const current = new Set(currentIds())
const missing = baseIds().filter((id) => !current.has(id))

if (missing.length > 0) {
  console.error(`These IDs exist at ${base} but are missing now. Retire Options instead of removing them:`)
  for (const id of missing) console.error(`  ${id}`)
  process.exit(1)
}
console.log(`No Drink, Slot or Option IDs removed since ${base}.`)
