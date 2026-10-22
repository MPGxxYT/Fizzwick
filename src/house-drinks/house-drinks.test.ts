import { describe, expect, test } from 'vitest'
import { checkEveryRiff, GLASSES, METHODS, parseDrinkFile, resolveRiff, type Drink } from '../riff-engine'
import { houseDrinks } from './catalog'

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

  test('each Drink points at its own photo', () => {
    for (const drink of houseDrinks) expect(drink.photo).toBe(`photos/${drink.id}.jpg`)
  })

  test('together they use every Method and every glass', () => {
    const methods = new Set(houseDrinks.flatMap((drink) => drink.slots.flatMap((slot) => slot.options.map((option) => option.method ?? drink.method))))
    expect([...methods].sort()).toEqual([...METHODS].sort())
    expect([...new Set(houseDrinks.map((drink) => drink.glass))].sort()).toEqual([...GLASSES].sort())
  })
})

describe('House Drink Riffs', () => {
  test('Tea Sour steeps black tea for 4 minutes and rooibos for 6', () => {
    const teaSour = houseDrink('tea-sour')
    const steep = (tea: string) => resolveRiff(teaSour, { tea }).steps.find((step) => step.id === 'steep-tea')
    expect(steep('black-tea')?.durationSeconds).toBe(240)
    expect(steep('rooibos')?.durationSeconds).toBe(360)
    expect(steep('rooibos')?.text).toContain('Steep the rooibos')
  })

  test('blending Cinnamon Cream switches to the blender and keeps the garnish last', () => {
    const riff = resolveRiff(houseDrink('cinnamon-cream'), { texture: 'blended' })
    expect(riff.method).toBe('blend')
    expect(riff.miseEnPlace.tools).toContain('blender')
    expect(riff.miseEnPlace.tools).not.toContain('shaker')
    expect(riff.steps.map((step) => step.id)).toEqual(['blend-base', 'blend', 'garnish'])
  })

  test('blended Cinnamon Cream with cold brew adds the coffee before blending', () => {
    const riff = resolveRiff(houseDrink('cinnamon-cream'), { texture: 'blended', coffee: 'cold-brew' })
    expect(riff.steps.map((step) => step.id)).toEqual(['blend-base', 'add-coffee', 'blend', 'garnish'])
    expect(riff.dietaryTags).toEqual(['caffeine', 'dairy'])
  })

  test('lemon in the Citrus Spritz adds a quarter ounce more of the picked sweetener', () => {
    const riff = resolveRiff(houseDrink('citrus-spritz'), { citrus: 'lemon-juice', sweetener: 'agave' })
    expect(riff.steps.map((step) => step.text)).toContain(
      'Add another quarter ounce of agave to balance the sharper lemon.',
    )
    expect(riff.ingredients).toContainEqual({ name: 'extra sweetener, to balance the lemon', amount: 0.25, unit: 'oz' })
  })
})

function houseDrink(id: string): Drink {
  const drink = houseDrinks.find((candidate) => candidate.id === id)
  if (!drink) throw new Error(`no House Drink "${id}"`)
  return drink
}
