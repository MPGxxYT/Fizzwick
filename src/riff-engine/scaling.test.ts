import { describe, expect, test } from 'vitest'
import cherryLimeadeFile from '../house-drinks/cherry-limeade.json'
import { GLASS_SIZES_OZ, parseDrinkFile, resolveRiff, type Drink, type Method } from '.'

function parse(input: unknown): Drink {
  const result = parseDrinkFile(input)
  if (!result.ok) throw new Error(result.errors.join('\n'))
  return result.drink
}

const cherryLimeade = parse(cherryLimeadeFile)

// One Slot, one Option, so each test can pick the Method and ingredients it needs.
function drinkWith(method: Method, ingredients: unknown[]): Drink {
  return parse({
    formatVersion: 1,
    id: 'test-drink',
    name: 'Test Drink',
    glass: 'rocks',
    method,
    flavorTags: ['citrus'],
    photo: 'photos/test-drink.jpg',
    ingredients,
    slots: [
      {
        id: 'base',
        label: 'Base',
        options: [{ id: 'water', label: 'Water', ingredients: [{ name: 'water', amount: 1, unit: 'oz' }], color: '#e0f2fe' }],
      },
    ],
    steps: [{ id: 'make', text: 'Make it.' }],
    houseSpec: { base: 'water' },
  })
}

const amounts = (drink: Drink, settings: Parameters<typeof resolveRiff>[2]) =>
  resolveRiff(drink, {}, settings).ingredients.map(({ name, amount, unit }) => (amount === undefined ? `${name}: ${unit}` : `${name}: ${amount} ${unit}`))

describe('units', () => {
  test('defaults to one serving in oz', () => {
    const riff = resolveRiff(cherryLimeade)
    expect(riff.servings).toBe(1)
    expect(riff.units).toBe('oz')
  })

  test('converts oz to ml at 30 ml per oz', () => {
    expect(amounts(cherryLimeade, { units: 'ml' })).toEqual([
      'ice: fill',
      'fresh lime juice: 25 ml',
      'cherry syrup: 25 ml',
      'lemon-lime soda: top',
      'lime wheel: 1 count',
      'cherry: 1 count',
    ])
  })

  test('rounds ml to the nearest 5 above 15 ml and the nearest 2.5 at or below', () => {
    const drink = drinkWith('build', [
      { name: 'a', amount: 0.33, unit: 'oz' }, // 9.9 ml
      { name: 'b', amount: 0.5, unit: 'oz' }, // 15 ml
      { name: 'c', amount: 0.6, unit: 'oz' }, // 18 ml
      { name: 'd', amount: 1.5, unit: 'oz' }, // 45 ml
      { name: 'e', amount: 2.1, unit: 'oz' }, // 63 ml
    ])
    expect(amounts(drink, { units: 'ml' }).slice(0, 5)).toEqual(['a: 10 ml', 'b: 15 ml', 'c: 20 ml', 'd: 45 ml', 'e: 65 ml'])
  })

  test('converts ml to oz, rounded to the nearest quarter ounce', () => {
    const drink = drinkWith('build', [{ name: 'a', amount: 20, unit: 'ml' }, { name: 'b', amount: 5, unit: 'ml' }])
    expect(amounts(drink, { units: 'oz' }).slice(0, 2)).toEqual(['a: 0.75 oz', 'b: 0.25 oz'])
  })

  test('never converts dashes, barspoons, cups or counts', () => {
    const drink = drinkWith('build', [
      { name: 'bitters', amount: 2, unit: 'dash' },
      { name: 'syrup', amount: 1, unit: 'barspoon' },
      { name: 'ice', amount: 1, unit: 'cup' },
      { name: 'mint leaves', amount: 8, unit: 'count' },
    ])
    expect(amounts(drink, { units: 'ml' }).slice(0, 4)).toEqual([
      'bitters: 2 dash',
      'syrup: 1 barspoon',
      'ice: 1 cup',
      'mint leaves: 8 count',
    ])
  })
})

describe('scaling', () => {
  test('scales numeric amounts by the serving count, before converting', () => {
    expect(amounts(cherryLimeade, { servings: 3 })).toContain('fresh lime juice: 2.25 oz')
    expect(amounts(cherryLimeade, { servings: 3, units: 'ml' })).toContain('fresh lime juice: 70 ml')
    expect(amounts(cherryLimeade, { servings: 3 })).toContain('lime wheel: 3 count')
  })

  test('never scales Top, to taste or fill', () => {
    const drink = drinkWith('build', [
      { name: 'salt', unit: 'to-taste' },
      { name: 'soda water', unit: 'top' },
    ])
    expect(amounts(drink, { servings: 6 }).slice(0, 2)).toEqual(['salt: to-taste', 'soda water: top'])
    expect(amounts(cherryLimeade, { servings: 6 })[0]).toBe('ice: fill')
  })

  test('the Mise en Place uses the scaled amounts and counts the glasses', () => {
    const riff = resolveRiff(cherryLimeade, {}, { servings: 4, units: 'ml' })
    expect(riff.miseEnPlace.glassCount).toBe(4)
    expect(riff.miseEnPlace.ingredients).toEqual(riff.ingredients)
    expect(riff.miseEnPlace.ingredients).toContainEqual({ name: 'cherry syrup', amount: 90, unit: 'ml' })
  })

  test('accepts 1 to 12 servings only', () => {
    expect(() => resolveRiff(cherryLimeade, {}, { servings: 0 })).toThrow('servings must be a whole number from 1 to 12')
    expect(() => resolveRiff(cherryLimeade, {}, { servings: 13 })).toThrow('servings must be a whole number from 1 to 12')
    expect(() => resolveRiff(cherryLimeade, {}, { servings: 1.5 })).toThrow('servings must be a whole number from 1 to 12')
    expect(resolveRiff(cherryLimeade, {}, { servings: 12 }).servings).toBe(12)
  })
})

describe('glass size', () => {
  test('each glass has a standard size, and a Riff reports the size it is made for', () => {
    expect(GLASS_SIZES_OZ.collins).toBe(12)
    expect(resolveRiff(cherryLimeade).glassOz).toBe(12)
    expect(resolveRiff(cherryLimeade, {}, { glassOz: 16 }).glassOz).toBe(16)
  })

  test('a bigger glass scales the pours to fit, rounded to quarter ounces', () => {
    expect(amounts(cherryLimeade, { glassOz: 16 })).toEqual([
      'ice: fill',
      'fresh lime juice: 1 oz',
      'cherry syrup: 1 oz',
      'lemon-lime soda: top',
      'lime wheel: 1 count',
      'cherry: 1 count',
    ])
  })

  test('a smaller glass scales the pours down, never below a quarter ounce', () => {
    const drink = drinkWith('build', [{ name: 'a', amount: 0.25, unit: 'oz' }])
    expect(amounts(drink, { glassOz: 4 })[0]).toBe('a: 0.25 oz')
  })

  test('glass size and servings scale together, before converting to ml', () => {
    expect(amounts(cherryLimeade, { glassOz: 16, servings: 2 })).toContain('fresh lime juice: 2 oz')
    expect(amounts(cherryLimeade, { glassOz: 16, units: 'ml' })).toContain('fresh lime juice: 30 ml')
  })

  test('the standard size changes nothing', () => {
    expect(resolveRiff(cherryLimeade, {}, { glassOz: 12 }).ingredients).toEqual(resolveRiff(cherryLimeade).ingredients)
  })

  test('accepts glass sizes from 2 to 64 oz only', () => {
    expect(() => resolveRiff(cherryLimeade, {}, { glassOz: 1 })).toThrow('glassOz must be from 2 to 64')
    expect(() => resolveRiff(cherryLimeade, {}, { glassOz: 65 })).toThrow('glassOz must be from 2 to 64')
  })
})

describe('batch notes', () => {
  const notes = (method: Method, servings: number) =>
    resolveRiff(drinkWith(method, []), {}, { servings }).batchNotes

  test('shaken, dry shaken and stirred Riffs work in rounds of 2 above 2 servings', () => {
    expect(notes('shake', 2)).toEqual([])
    expect(notes('shake', 3)).toEqual(['A shaker holds about 2 drinks, so shake in 2 rounds.'])
    expect(notes('dry-shake', 5)).toEqual(['A shaker holds about 2 drinks, so shake in 3 rounds.'])
    expect(notes('stir', 6)).toEqual(['A mixing glass holds about 2 drinks, so stir in 3 rounds.'])
  })

  test('blended Riffs note the blender limit above 4 servings', () => {
    expect(notes('blend', 4)).toEqual([])
    expect(notes('blend', 9)).toEqual(['A blender holds about 4 drinks, so blend in 3 batches.'])
  })

  test('built Riffs need no batch notes', () => {
    expect(notes('build', 12)).toEqual([])
  })
})
