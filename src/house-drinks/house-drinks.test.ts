import { describe, expect, test } from 'vitest'
import { checkEveryRiff, parseDrinkFile } from '../riff-engine'

// Every House Drink file in this folder must parse, and every combination of
// its Options must resolve. CI runs this on every change.
const files = import.meta.glob<unknown>('./*.json', { eager: true, import: 'default' })

describe('House Drink files', () => {
  test('there is at least one House Drink', () => {
    expect(Object.keys(files).length).toBeGreaterThan(0)
  })

  test.each(Object.entries(files))('%s parses without errors', (path, contents) => {
    const result = parseDrinkFile(contents)
    expect(result.ok ? [] : result.errors).toEqual([])
    if (result.ok) expect(`./${result.drink.id}.json`).toBe(path)
  })

  test.each(Object.entries(files))('%s resolves for every combination of Options', (_path, contents) => {
    const result = parseDrinkFile(contents)
    if (!result.ok) throw new Error(result.errors.join('\n'))
    expect(checkEveryRiff(result.drink)).toEqual([])
  })

  test('Drink IDs are unique', () => {
    const ids = Object.values(files).map((contents) => (contents as { id: string }).id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
