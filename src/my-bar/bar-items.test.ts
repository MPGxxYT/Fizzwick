import { describe, expect, test } from 'vitest'
import { houseDrinks } from '../house-drinks/catalog'
import {
  ALWAYS_ON_HAND,
  BAR_ITEMS,
  barItemById,
  barItemFor,
  COUNTS_AS_ON_HAND,
  COUNTS_AS_OWN,
  countedAs,
  isAlwaysOnHand,
  namesOf,
  suggestCountsAs,
} from './bar-items'

// Every name a House Drink uses, Retired Options included: a Favorite can
// still open one.
const houseNames = [
  ...new Set(
    houseDrinks.flatMap((drink) => [
      ...drink.ingredients,
      ...drink.slots.flatMap((slot) => slot.options.flatMap((option) => option.ingredients)),
    ]),
  ),
].map((ingredient) => ingredient.name.toLowerCase())

describe('suggestCountsAs', () => {
  const suggested = (name: string) => {
    const counted = suggestCountsAs(name)
    return typeof counted === 'string' ? counted : counted.id
  }

  test('finds a Bar Item from a word in the name', () => {
    expect(suggested('charred lemon wheel')).toBe('lemons')
    expect(suggested('Lemon')).toBe('lemons')
    expect(suggested('fresh mint')).toBe('mint')
    expect(suggested('blueberry')).toBe('blueberries')
    expect(suggested('half a lime')).toBe('limes')
  })

  test('goes by the exact wording first', () => {
    expect(suggested('fresh lemon juice')).toBe('lemons')
    expect(suggested('raspberry syrup')).toBe('raspberry-syrup')
    expect(suggested('pickle spear')).toBe('pickles')
  })

  test('takes the longest label', () => {
    expect(suggested('good tart cherry juice')).toBe('tart-cherry-juice')
    expect(suggested('smoky black tea')).toBe('black-tea')
  })

  test('a name with no match is its own item', () => {
    expect(suggested('yuzu juice')).toBe(COUNTS_AS_OWN)
    expect(suggested('smoked bark')).toBe(COUNTS_AS_OWN)
  })

  test('a word for another kind of thing keeps it apart', () => {
    expect(suggested('lemon syrup')).toBe(COUNTS_AS_OWN)
    expect(suggested('mint tea')).toBe(COUNTS_AS_OWN)
    expect(suggested('ice cream')).toBe(COUNTS_AS_OWN)
    expect(suggested('lime soda')).toBe(COUNTS_AS_OWN)
  })

  test('never suggests a garnish-only item, which can not be ticked', () => {
    expect(suggested('orange juice')).toBe(COUNTS_AS_OWN)
  })

  test('plain water is always on hand, and other waters are not', () => {
    expect(suggested('water')).toBe(COUNTS_AS_ON_HAND)
    expect(suggested('Cold Water')).toBe(COUNTS_AS_ON_HAND)
    expect(suggested('warm water')).toBe(COUNTS_AS_ON_HAND)
    expect(suggested('coconut water')).toBe(COUNTS_AS_OWN)
    expect(suggested('soda water')).toBe('soda-water')
  })
})

describe('countedAs', () => {
  test('keeps the choice saved on the ingredient', () => {
    expect(countedAs({ name: 'charred lemon wheel', countsAs: COUNTS_AS_OWN })).toBe(COUNTS_AS_OWN)
    expect(countedAs({ name: 'yuzu juice', countsAs: COUNTS_AS_ON_HAND })).toBe(COUNTS_AS_ON_HAND)
    expect(countedAs({ name: 'yuzu juice', countsAs: 'lemons' })).toBe(barItemById('lemons'))
  })

  test('falls back to the suggestion with no choice or an unknown ID', () => {
    expect(countedAs({ name: 'charred lemon wheel' })).toBe(barItemById('lemons'))
    expect(countedAs({ name: 'charred lemon wheel', countsAs: 'gone-item' })).toBe(barItemById('lemons'))
  })
})

describe('the Bar Items list', () => {
  test('every House Drink ingredient name is a Bar Item or always on hand', () => {
    expect(houseNames.filter((name) => !barItemFor(name) && !isAlwaysOnHand(name))).toEqual([])
  })

  test('every name it lists is one a House Drink uses', () => {
    const listed = [...BAR_ITEMS.flatMap(namesOf), ...ALWAYS_ON_HAND]
    expect(listed.filter((name) => !houseNames.includes(name))).toEqual([])
  })

  test('a name belongs to one item, and an ID to one item', () => {
    const names = BAR_ITEMS.flatMap(namesOf)
    expect(new Set(names).size).toBe(names.length)
    expect(new Set(BAR_ITEMS.map((item) => item.id)).size).toBe(BAR_ITEMS.length)
  })

  test('only the Garnishes group has items with nothing needed', () => {
    expect(BAR_ITEMS.filter((item) => item.group === 'Garnishes').every((item) => item.covers.length === 0)).toBe(true)
    expect(BAR_ITEMS.filter((item) => item.group !== 'Garnishes').every((item) => item.covers.length > 0)).toBe(true)
  })

  test('finds an item by a recipe wording, ignoring case', () => {
    expect(barItemFor('Fresh Lemon Juice')?.id).toBe('lemons')
    expect(barItemFor('lemon wheel')?.id).toBe('lemons')
    expect(barItemFor('crushed ice')?.id).toBe('ice')
    expect(barItemFor('durian foam')).toBeUndefined()
    expect(barItemById('lemons')?.label).toBe('Lemons')
  })

  test('water is always on hand, and soda water is not', () => {
    expect(isAlwaysOnHand('Cold Water')).toBe(true)
    expect(isAlwaysOnHand('just-boiled water')).toBe(true)
    expect(isAlwaysOnHand('soda water')).toBe(false)
  })
})
