import { describe, expect, test } from 'vitest'
import cherryLimeadeFile from '../house-drinks/cherry-limeade.json'
import { parseDrinkFile, readRiffLink, resolveRiff, riffLink, type Drink, type Picks } from '.'

function parse(input: unknown): Drink {
  const result = parseDrinkFile(input)
  if (!result.ok) throw new Error(result.errors.join('\n'))
  return result.drink
}

const limeade = parse(cherryLimeadeFile)

describe('riffLink', () => {
  test('the House Spec is just the Drink path', () => {
    expect(riffLink(limeade, resolveRiff(limeade).picks)).toBe('/drinks/cherry-limeade')
  })

  test('lists only the Slots that differ from the House Spec, in Slot order, with IDs only', () => {
    const { picks } = resolveRiff(limeade, { fizz: 'soda-water', cherry: 'muddled-cherries', sweetener: 'agave' })
    expect(riffLink(limeade, picks)).toBe('/drinks/cherry-limeade/cherry=muddled-cherries,sweetener=agave,fizz=soda-water')
  })

  test('writes an empty optional Slot as a dash', () => {
    const { picks } = resolveRiff(limeade, { garnish: null })
    expect(riffLink(limeade, picks)).toBe('/drinks/cherry-limeade/garnish=-')
  })
})

describe('readRiffLink', () => {
  test('a link opens the same Riff it was made from', () => {
    const riffs: Picks[] = [
      {},
      { fizz: 'soda-water' },
      { cherry: 'tart-cherry-juice', sweetener: 'simple-syrup', garnish: null },
      { cherry: 'muddled-cherries', sweetener: 'agave', fizz: 'sparkling-limeade', garnish: 'lime-wheel' },
    ]
    for (const requested of riffs) {
      const { picks } = resolveRiff(limeade, requested)
      const pairs = riffLink(limeade, picks).split('/')[3]
      expect(readRiffLink(limeade, pairs)).toEqual({ picks, fellBack: [] })
    }
  })

  test('no pairs opens the House Spec', () => {
    expect(readRiffLink(limeade, undefined)).toEqual({ picks: limeade.houseSpec, fellBack: [] })
    expect(readRiffLink(limeade, '')).toEqual({ picks: limeade.houseSpec, fellBack: [] })
  })

  test('an unknown Option falls back to the House Spec for that Slot and says which Slot', () => {
    expect(readRiffLink(limeade, 'cherry=muddled-cherries,fizz=dragonfruit-soda')).toEqual({
      picks: { ...limeade.houseSpec, cherry: 'muddled-cherries' },
      fellBack: ['fizz'],
    })
  })

  test('an empty Slot that must be filled falls back too', () => {
    expect(readRiffLink(limeade, 'fizz=-').fellBack).toEqual(['fizz'])
  })

  test('a Retired Option opens and the Riff marks it as retired', () => {
    const drink: Drink = structuredClone(limeade)
    drink.slots.find((slot) => slot.id === 'fizz')!.options.find((option) => option.id === 'soda-water')!.retired = true
    const { picks, fellBack } = readRiffLink(drink, 'fizz=soda-water')
    expect(fellBack).toEqual([])
    expect(resolveRiff(drink, picks).slots.find((slot) => slot.id === 'fizz')?.option).toMatchObject({
      id: 'soda-water',
      retired: true,
    })
  })

  test('ignores Slots the Drink does not have and pairs it cannot read', () => {
    expect(readRiffLink(limeade, 'ice=crushed,nonsense,=,fizz=soda-water')).toEqual({
      picks: { ...limeade.houseSpec, fizz: 'soda-water' },
      fellBack: [],
    })
  })
})
