import { describe, expect, test } from 'vitest'
import { markBarTerms } from '../bar-terms'
import { GLASS_NAMES, isMakeAhead, METHOD_NAMES, TOOL_NAMES } from '../drink-page/format'
import { checkEveryRiff, GLASSES, METHODS, parseDrinkFile, resolveRiff, type Drink, type Ingredient, type Picks } from '../riff-engine'
import { timedPart } from '../step-mode/timed-part'
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

  test('only the drinks with tea to brew and chill have a make-ahead step', () => {
    const withAhead = houseDrinks.filter((drink) => resolveRiff(drink).steps.some(isMakeAhead)).map((drink) => drink.id)
    expect(withAhead).toEqual(['black-tea-old-fashioned', 'hibiscus-stir', 'porch-tea', 'tea-sour'])
  })

  test('tart cherry juice in the Hibiscus Stir has no tea to brew', () => {
    const riff = resolveRiff(houseDrink('hibiscus-stir'), { base: 'tart-cherry-juice' })
    expect(riff.steps.map((step) => step.id)).toEqual(['add-base', 'stir', 'strain', 'express-peel'])
    expect(riff.miseEnPlace.tools).not.toContain('kettle')
  })

  test('sparkling lemonade in Porch Tea skips mixing the lemonade', () => {
    const porchTea = houseDrink('porch-tea')
    expect(resolveRiff(porchTea).steps.map((step) => step.id)).toContain('mix-lemonade')
    const riff = resolveRiff(porchTea, { lemonade: 'sparkling-lemonade' })
    expect(riff.steps.map((step) => step.id)).toEqual(['brew-tea', 'fill-glass', 'pour-tea', 'top', 'garnish'])
    expect(riff.ingredients.map((ingredient) => ingredient.name)).not.toContain('simple syrup')
  })

  test('blending the Nada Colada switches to the blender and pours into the hurricane glass', () => {
    const riff = resolveRiff(houseDrink('nada-colada'), { texture: 'blended' })
    expect(riff.method).toBe('blend')
    expect(riff.miseEnPlace.tools).toContain('blender')
    expect(riff.miseEnPlace.tools).not.toContain('shaker')
    expect(riff.steps.map((step) => step.id)).toEqual(['blend-base', 'blend', 'garnish'])
  })

  test('the Shirley Temple pours its grenadine last, and the grenadine says how to make it', () => {
    const riff = resolveRiff(houseDrink('shirley-temple'))
    expect(riff.steps.map((step) => step.id)).toEqual(['fill-glass', 'top', 'grenadine', 'garnish'])
    const [segments] = markBarTerms(['grenadine'])
    expect(segments[0].term?.prep?.heading).toBe('How to make it')
  })

  test('the Espresso Tonic floats the coffee on the tonic last, and cold brew keeps the caffeine tag', () => {
    const espressoTonic = houseDrink('espresso-tonic')
    expect(resolveRiff(espressoTonic).steps.map((step) => step.id)).toEqual(['fill-glass', 'pour-tonic', 'float-coffee', 'express-peel'])
    const riff = resolveRiff(espressoTonic, { coffee: 'cold-brew', garnish: null })
    expect(riff.steps.map((step) => step.id)).toEqual(['fill-glass', 'pour-tonic', 'float-coffee'])
    expect(riff.dietaryTags).toEqual(['caffeine'])
  })

  test('hot rooibos in the Ginger Toddy steeps in the mug before the honey goes in', () => {
    const toddy = houseDrink('ginger-toddy')
    expect(resolveRiff(toddy).steps.map((step) => step.id)).toEqual(['boil-water', 'add-base', 'garnish'])
    const riff = resolveRiff(toddy, { base: 'rooibos' })
    expect(riff.steps.map((step) => step.id)).toEqual(['boil-water', 'steep-tea', 'add-base', 'garnish'])
    expect(riff.steps.find((step) => step.id === 'steep-tea')?.durationSeconds).toBe(300)
    expect(riff.miseEnPlace.tools).toContain('kettle')
  })

  test('fresh raspberries in the Raspberry Clover are muddled in the tin first, and aquafaba drops the egg tag', () => {
    const clover = houseDrink('raspberry-clover')
    const houseSpec = resolveRiff(clover)
    expect(houseSpec.steps.map((step) => step.id)).toEqual(['chill-glass', 'add-base', 'dry-shake', 'shake', 'fine-strain', 'garnish'])
    expect(houseSpec.dietaryTags).toEqual(['egg'])
    const riff = resolveRiff(clover, { raspberry: 'fresh-raspberries', foam: 'aquafaba' })
    expect(riff.steps.map((step) => step.id)).toEqual(['chill-glass', 'muddle-raspberries', 'add-base', 'dry-shake', 'shake', 'fine-strain', 'garnish'])
    expect(riff.miseEnPlace.tools).toContain('muddler')
    expect(riff.dietaryTags).toEqual([])
  })

  test('ripe mango in the Mango Lassi blends with ice, frozen mango without, and coconut yogurt drops the dairy tag', () => {
    const lassi = houseDrink('mango-lassi')
    const names = (picks: Picks) => resolveRiff(lassi, picks).ingredients.map((ingredient) => ingredient.name)
    expect(names({})).toContain('ice cubes')
    expect(names({ mango: 'frozen-mango' })).not.toContain('ice cubes')
    expect(resolveRiff(lassi).dietaryTags).toEqual(['dairy'])
    expect(resolveRiff(lassi, { yogurt: 'coconut-yogurt' }).dietaryTags).toEqual([])
  })

  test('the Salty Paloma salts the rim first, and soda water brings agave to sweeten it', () => {
    const paloma = houseDrink('salty-paloma')
    expect(resolveRiff(paloma).steps.map((step) => step.id)).toEqual(['rim-glass', 'fill-glass', 'add-juice', 'top', 'garnish'])
    const riff = resolveRiff(paloma, { fizz: 'soda-water' })
    expect(riff.ingredients).toContainEqual({ name: 'agave', amount: 0.5, unit: 'oz' })
    expect(riff.steps.map((step) => step.id)).toEqual(['rim-glass', 'fill-glass', 'add-juice', 'add-agave', 'top', 'garnish'])
    const [segments] = markBarTerms(['rim'])
    expect(segments[0].term?.prep?.heading).toBe('How to do it')
  })

  test('the Virgin Mary is savory and rolled between the tins, not shaken', () => {
    const virginMary = houseDrink('virgin-mary')
    expect(virginMary.flavorTags).toContain('savory')
    const riff = resolveRiff(virginMary, { heat: 'horseradish' })
    expect(riff.steps.map((step) => step.id)).toEqual(['add-base', 'roll', 'fill-glass', 'strain', 'garnish'])
    expect(riff.steps.find((step) => step.id === 'roll')?.tools).toEqual(['shaker'])
    expect(riff.steps.find((step) => step.id === 'add-base')?.text).toContain('horseradish')
  })

  test('blueberry syrup in the Blueberry Fizz skips the muddling and starts in the tin', () => {
    const riff = resolveRiff(houseDrink('blueberry-fizz'), { blueberry: 'blueberry-syrup', herb: null })
    expect(riff.steps.map((step) => step.id)).toEqual(['add-syrup', 'add-base', 'shake', 'fill-glass', 'strain', 'top', 'garnish'])
    expect(riff.miseEnPlace.tools).not.toContain('muddler')
  })
})

describe('House Drink timers', () => {
  // Step mode colors the part of a timed step its timer is for, so every
  // timed step has to name a timed action (steep, stir, shake or blend).
  test.each(houseDrinks.map((drink) => [drink.id, drink] as const))('%s names what each timer is for', (_id, drink) => {
    const options = drink.slots.flatMap((slot) => slot.options)
    const steps = [...drink.steps, ...options.flatMap((option) => (option.addSteps ?? []).map(({ step }) => step))]
    const timedIds = new Set(options.flatMap((option) => Object.keys(option.durations ?? {})))
    const unnamed = steps.filter((step) => (step.durationSeconds || timedIds.has(step.id)) && !timedPart(step.text))
    expect(unnamed.map((step) => step.id)).toEqual([])
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

  // A syrup you make at home needs a Bar Term with its recipe. Bought ones
  // are listed here instead.
  const BOUGHT_SYRUPS = new Set(['maple syrup'])

  test.each(houseDrinks.map((drink) => [drink.id, drink] as const))(
    '%s uses no homemade syrup without a Bar Term that says how to make it',
    (_id, drink) => {
      const options = drink.slots.flatMap((slot) => slot.options)
      const syrups = [...drink.ingredients, ...options.flatMap((option) => option.ingredients)]
        .map((ingredient) => ingredient.name)
        .filter((name) => /syrup$/i.test(name) && !BOUGHT_SYRUPS.has(name))
      const missing = syrups.filter((name) => {
        const [segments] = markBarTerms([name])
        return !(segments.length === 1 && segments[0].term?.prep)
      })
      expect([...new Set(missing)]).toEqual([])
    },
  )
})
