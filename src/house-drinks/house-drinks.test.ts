import { describe, expect, test } from 'vitest'
import { markBarTerms } from '../bar-terms'
import { GLASS_NAMES, METHOD_NAMES, TOOL_NAMES } from '../drink-page/format'
import { checkEveryRiff, GLASSES, METHODS, parseDrinkFile, resolveRiff, type Drink, type Ingredient } from '../riff-engine'
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

  test('blueberry syrup in the Blueberry Fizz skips the muddling and starts in the tin', () => {
    const riff = resolveRiff(houseDrink('blueberry-fizz'), { blueberry: 'blueberry-syrup', herb: null })
    expect(riff.steps.map((step) => step.id)).toEqual(['add-syrup', 'add-base', 'shake', 'fill-glass', 'strain', 'top', 'garnish'])
    expect(riff.miseEnPlace.tools).not.toContain('muddler')
  })
})

function houseDrink(id: string): Drink {
  const drink = houseDrinks.find((candidate) => candidate.id === id)
  if (!drink) throw new Error(`no House Drink "${id}"`)
  return drink
}

// Drink files never tag Bar Terms by hand, but every bartending word a House
// Drink uses through its Method, glass, tools and measures needs a Bar Term.
// Words anyone knows are listed here instead.
const PLAIN_WORDS = new Set(['mug', 'kettle', 'blender', 'peeler', 'oz', 'ml', 'cup', 'count', 'to-taste', 'fill'])
type Unit = Ingredient['unit']
const UNIT_WORDS: Partial<Record<Unit, string>> = { top: 'Top', dash: 'dash', barspoon: 'barspoon' }

function vocabulary(drink: Drink): { id: string; word: string }[] {
  const options = drink.slots.flatMap((slot) => slot.options)
  const steps = [...drink.steps, ...options.flatMap((option) => (option.addSteps ?? []).map(({ step }) => step))]
  const methods = [drink.method, ...options.flatMap((option) => option.method ?? [])]
  const tools = steps.flatMap((step) => step.tools ?? [])
  const units = [...drink.ingredients, ...options.flatMap((option) => option.ingredients)].map((ingredient) => ingredient.unit)
  return [
    ...methods.map((id) => ({ id, word: METHOD_NAMES[id] })),
    { id: drink.glass, word: GLASS_NAMES[drink.glass] },
    ...tools.map((id) => ({ id, word: TOOL_NAMES[id] })),
    ...units.map((id) => ({ id, word: UNIT_WORDS[id] ?? id })),
  ].filter(({ id }) => !PLAIN_WORDS.has(id))
}

describe('House Drink Bar Terms', () => {
  test.each(houseDrinks.map((drink) => [drink.id, drink] as const))(
    '%s uses no bartending word without a Bar Term',
    (_id, drink) => {
      const missing = vocabulary(drink)
        .filter(({ word }) => {
          const [segments] = markBarTerms([word])
          return !(segments.length === 1 && segments[0].term)
        })
        .map(({ word }) => word)
      expect([...new Set(missing)]).toEqual([])
    },
  )
})
