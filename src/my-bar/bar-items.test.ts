import { describe, expect, test } from 'vitest'
import { houseDrinks } from '../house-drinks/catalog'
import { ALWAYS_ON_HAND, BAR_ITEMS, barItemById, barItemFor, isAlwaysOnHand, namesOf } from './bar-items'

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
