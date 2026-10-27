import { describe, expect, test } from 'vitest'
import { parseDrinkFile, resolveRiff, type Drink } from '../riff-engine'
import cherryLimeadeFile from '../house-drinks/cherry-limeade.json'
import { copyDrink, isCustomDrinkId, nameTaken } from './copy-drink'

function parse(input: unknown): Drink {
  const result = parseDrinkFile(input)
  if (!result.ok) throw new Error(result.errors.join('\n'))
  return result.drink
}

const cherryLimeade = parse(cherryLimeadeFile)
const sodaWater = { ...cherryLimeade.houseSpec, fizz: 'soda-water' }

describe('copyDrink', () => {
  test('a copy of a Riff takes its default Favorite name and makes that Riff its House Spec', () => {
    const copy = copyDrink(cherryLimeade, sodaWater, ['Cherry Limeade'], 'k3x9q2')
    expect(copy.name).toBe('Cherry Limeade · soda water')
    expect(copy.houseSpec).toEqual(sodaWater)
    expect(resolveRiff(copy).isHouseSpec).toBe(true)
  })

  test('a copy gets a my- ID and keeps every Slot and Option with their IDs', () => {
    const copy = copyDrink(cherryLimeade, sodaWater, [], 'k3x9q2')
    expect(copy.id).toBe('my-k3x9q2')
    expect(copy.slots).toEqual(cherryLimeade.slots)
    expect(copy.steps).toEqual(cherryLimeade.steps)
  })

  test('a copy has no photo, so it shows the glass drawing', () => {
    expect(copyDrink(cherryLimeade, sodaWater, [], 'a').photo).toBeUndefined()
  })

  test('copying the House Spec adds "(copy)", then numbers further copies', () => {
    const taken = ['Cherry Limeade']
    expect(copyDrink(cherryLimeade, cherryLimeade.houseSpec, taken, 'a').name).toBe('Cherry Limeade (copy)')
    taken.push('Cherry Limeade (copy)')
    expect(copyDrink(cherryLimeade, cherryLimeade.houseSpec, taken, 'b').name).toBe('Cherry Limeade (copy 2)')
    expect(copyDrink(cherryLimeade, sodaWater, [...taken, 'cherry limeade · SODA WATER '], 'c').name).toBe(
      'Cherry Limeade · soda water (copy)',
    )
  })

  test('a copy is a valid Drink file', () => {
    const copy = copyDrink(cherryLimeade, sodaWater, [], 'k3x9q2')
    expect(parseDrinkFile(JSON.parse(JSON.stringify(copy)))).toEqual({ ok: true, drink: copy })
  })

  test('a copy of a copy works the same way', () => {
    const first = copyDrink(cherryLimeade, sodaWater, [], 'one')
    const second = copyDrink(first, { ...first.houseSpec, sweetener: 'agave' }, [first.name], 'two')
    expect(second.name).toBe('Cherry Limeade · soda water · agave')
    expect(second.id).toBe('my-two')
  })
})

describe('nameTaken', () => {
  test('ignores case and spaces at the ends', () => {
    expect(nameTaken('  cherry LIMEADE ', ['Cherry Limeade'])).toBe(true)
    expect(nameTaken('Cherry Limeade 2', ['Cherry Limeade'])).toBe(false)
  })
})

describe('isCustomDrinkId', () => {
  test('Custom Drink IDs start with my-', () => {
    expect(isCustomDrinkId('my-k3x9q2')).toBe(true)
    expect(isCustomDrinkId('cherry-limeade')).toBe(false)
    expect(isCustomDrinkId('mystic-mule')).toBe(false)
  })
})
