import { describe, expect, it } from 'vitest'
import { findHouseDrink } from '../house-drinks/catalog'
import { FORMAT_VERSION, resolveRiff, type Drink } from '../riff-engine'
import { favoritePicks, newFavorite, sameRiff } from './favorite'

const limeade = findHouseDrink('cherry-limeade')!

describe('newFavorite', () => {
  it('keeps IDs only, with the default name and the format version', () => {
    const riff = resolveRiff(limeade, { fizz: 'soda-water' }, { servings: 3, units: 'ml' })
    expect(newFavorite(riff, 'fav-1', 1_000)).toEqual({
      id: 'fav-1',
      drinkId: 'cherry-limeade',
      picks: riff.picks,
      name: riff.defaultFavoriteName,
      note: '',
      createdAt: 1_000,
      updatedAt: 1_000,
      formatVersion: FORMAT_VERSION,
    })
  })
})

describe('favoritePicks', () => {
  it('opens the exact Riff that was saved', () => {
    const { picks } = resolveRiff(limeade, { cherry: 'muddled-cherries', fizz: 'soda-water' })
    expect(favoritePicks(limeade, picks)).toEqual(picks)
  })

  it('keeps a Retired Option, which the Riff then marks as retired', () => {
    const drink: Drink = structuredClone(limeade)
    const fizz = drink.slots.find((slot) => slot.id === 'fizz')!
    fizz.options.find((option) => option.id === 'soda-water')!.retired = true
    const picks = favoritePicks(drink, { ...drink.houseSpec, fizz: 'soda-water' })
    expect(resolveRiff(drink, picks).slots.find((slot) => slot.id === 'fizz')?.option).toMatchObject({
      id: 'soda-water',
      retired: true,
    })
  })

  it('uses the House Spec for picks the Drink no longer understands', () => {
    expect(favoritePicks(limeade, { fizz: 'no-such-option', gone: 'x', cherry: 'muddled-cherries' })).toEqual({
      ...limeade.houseSpec,
      cherry: 'muddled-cherries',
    })
  })

  it('keeps an empty optional Slot empty, and fills an empty Slot that must have an Option', () => {
    const optional = limeade.slots.find((slot) => slot.optional)!
    const required = limeade.slots.find((slot) => !slot.optional)!
    const picks = favoritePicks(limeade, { [optional.id]: null, [required.id]: null })
    expect(picks[optional.id]).toBeNull()
    expect(picks[required.id]).toBe(limeade.houseSpec[required.id])
  })
})

describe('sameRiff', () => {
  it('compares picks Slot by Slot, in any order', () => {
    expect(sameRiff({ a: 'x', b: null }, { b: null, a: 'x' })).toBe(true)
    expect(sameRiff({ a: 'x', b: null }, { a: 'x', b: 'y' })).toBe(false)
    expect(sameRiff({ a: 'x' }, { a: 'x', b: 'y' })).toBe(false)
  })
})
