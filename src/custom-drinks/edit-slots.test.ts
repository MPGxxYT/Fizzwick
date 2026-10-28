import { describe, expect, test } from 'vitest'
import cherryLimeadeFile from '../house-drinks/cherry-limeade.json'
import { parseDrinkFile, type Drink } from '../riff-engine'
import type { Favorite } from '../favorites/favorite'
import { copyDrink } from './copy-drink'
import { colorFor } from './suggest'
import { addOption, addSlot, favoritesPickingFrom, idFromLabel, removeOption, removeSlot, setOptionLabel } from './edit-slots'

function parse(input: unknown): Drink {
  const result = parseDrinkFile(input)
  if (!result.ok) throw new Error(result.errors.join('\n'))
  return result.drink
}

const copy = copyDrink(parse(cherryLimeadeFile), parse(cherryLimeadeFile).houseSpec, [], 'abc')

const favorite = (picks: Favorite['picks'], drinkId = copy.id): Favorite => ({
  id: 'f',
  drinkId,
  picks,
  name: 'x',
  note: '',
  createdAt: 0,
  updatedAt: 0,
  formatVersion: 1,
})

const slot = (drink: Drink, id: string) => drink.slots.find((s) => s.id === id)!

describe('idFromLabel', () => {
  test('makes kebab-case IDs, numbered when taken', () => {
    expect(idFromLabel('Fresh Herb!', [], 'slot')).toBe('fresh-herb')
    expect(idFromLabel('Fizz', ['fizz'], 'slot')).toBe('fizz-2')
    expect(idFromLabel('Fizz', ['fizz', 'fizz-2'], 'slot')).toBe('fizz-3')
    expect(idFromLabel('  ', [], 'option')).toBe('option')
    expect(idFromLabel('Crème brûlée', [], 'option')).toBe('creme-brulee')
  })
})

describe('addSlot', () => {
  test('adds a Slot with one Option, picked as its House Spec', () => {
    const drink = addSlot(copy, 'Herb')
    const herb = slot(drink, 'herb')
    expect(herb.label).toBe('Herb')
    expect(herb.options).toHaveLength(1)
    expect(drink.houseSpec.herb).toBe(herb.options[0].id)
  })
})

describe('addOption and setOptionLabel', () => {
  test('a new Option gets an ID from its label once, and renaming keeps it', () => {
    let drink = addOption(copy, 'fizz', 'Ginger ale')
    expect(slot(drink, 'fizz').options.at(-1)?.id).toBe('ginger-ale')
    drink = setOptionLabel(drink, 'fizz', 'ginger-ale', 'Spicy ginger ale')
    expect(slot(drink, 'fizz').options.at(-1)).toMatchObject({ id: 'ginger-ale', label: 'Spicy ginger ale' })
  })

  test('a new Option takes its color from its name when it can', () => {
    const drink = addOption(copy, 'cherry', 'Blueberry syrup')
    expect(slot(drink, 'cherry').options.at(-1)?.color).toBe(colorFor('blueberry'))
  })
})

describe('removeOption', () => {
  test('removes an Option nothing uses', () => {
    const drink = removeOption(copy, 'fizz', 'sparkling-limeade', [])
    expect(slot(drink, 'fizz').options.map((o) => o.id)).toEqual(['lemon-lime-soda', 'soda-water'])
  })

  test('retires an Option a Favorite uses, so the Favorite still opens', () => {
    const favorites = [favorite({ ...copy.houseSpec, fizz: 'sparkling-limeade' })]
    const drink = removeOption(copy, 'fizz', 'sparkling-limeade', favorites)
    expect(slot(drink, 'fizz').options.find((o) => o.id === 'sparkling-limeade')?.retired).toBe(true)
  })

  test("ignores other Drinks' Favorites", () => {
    const favorites = [favorite({ fizz: 'sparkling-limeade' }, 'cherry-limeade')]
    expect(slot(removeOption(copy, 'fizz', 'sparkling-limeade', favorites), 'fizz').options).toHaveLength(2)
  })

  test('moves the House Spec to the first Option left', () => {
    const drink = removeOption(copy, 'fizz', 'lemon-lime-soda', [])
    expect(drink.houseSpec.fizz).toBe('soda-water')
  })
})

describe('removeSlot', () => {
  test('removes the Slot, its House Spec pick, and step conditions on it', () => {
    const drink = removeSlot(copy, 'sweetener')
    expect(drink.slots.map((s) => s.id)).toEqual(['cherry', 'fizz', 'garnish'])
    expect('sweetener' in drink.houseSpec).toBe(false)
    expect(drink.steps.find((s) => s.id === 'add-sweetener')?.when).toBeUndefined()
  })
})

describe('favoritesPickingFrom', () => {
  test('counts Favorites of this Drink that have an Option in the Slot', () => {
    const favorites = [
      favorite({ ...copy.houseSpec, sweetener: 'agave' }),
      favorite({ ...copy.houseSpec, sweetener: null }),
      favorite({ sweetener: 'agave' }, 'cherry-limeade'),
    ]
    expect(favoritesPickingFrom(copy.id, 'sweetener', favorites)).toBe(1)
    expect(favoritesPickingFrom(copy.id, 'fizz', favorites)).toBe(2)
  })
})
