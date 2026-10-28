import { describe, expect, test } from 'vitest'
import { houseDrinks } from '../house-drinks/catalog'
import { colorFor, PALETTE, suggestDietaryTags, suggestTools } from './suggest'

describe('suggestTools', () => {
  test('suggests tools from the words in a step', () => {
    expect(suggestTools('Muddle the mint with the lime.')).toEqual(['muddler'])
    expect(suggestTools('Double strain into the glass.')).toEqual(['fine-strainer'])
    expect(suggestTools('Fine strain over fresh ice.')).toEqual(['fine-strainer'])
    expect(suggestTools('Strain into a coupe.')).toEqual(['strainer'])
    expect(suggestTools('Stir gently.')).toEqual(['barspoon'])
    expect(suggestTools('Express the peel over the drink.')).toEqual(['peeler'])
    expect(suggestTools('Steep the tea for 4 minutes.')).toEqual(['kettle'])
    expect(suggestTools('Blend until smooth.')).toEqual(['blender'])
    expect(suggestTools('Measure the lime juice into the tin and shake hard.')).toEqual(['jigger', 'shaker'])
    expect(suggestTools('Garnish with a mint sprig.')).toEqual([])
  })
})

describe('suggestDietaryTags', () => {
  test('suggests tags from ingredient words', () => {
    expect(suggestDietaryTags(['whole milk'])).toEqual(['dairy'])
    expect(suggestDietaryTags(['oat milk'])).toEqual([])
    expect(suggestDietaryTags(['almond milk'])).toEqual(['nuts'])
    expect(suggestDietaryTags(['coconut cream'])).toEqual([])
    expect(suggestDietaryTags(['egg white'])).toEqual(['egg'])
    expect(suggestDietaryTags(['cold brew coffee', 'heavy cream'])).toEqual(['caffeine', 'dairy'])
    expect(suggestDietaryTags(['chilled rooibos'])).toEqual([])
    expect(suggestDietaryTags(['chilled strong black tea'])).toEqual(['caffeine'])
  })

  test('agrees with the tags on every House Drink Option', () => {
    for (const drink of houseDrinks) {
      for (const slot of drink.slots) {
        for (const option of slot.options) {
          const suggested = suggestDietaryTags(option.ingredients.map((ingredient) => ingredient.name))
          expect([drink.id, option.id, suggested]).toEqual([drink.id, option.id, option.dietaryTags ?? []])
        }
      }
    }
  })
})

describe('colorFor', () => {
  test('picks a swatch that looks like the ingredient', () => {
    expect(colorFor('Blueberry syrup')).toBe(PALETTE.find((swatch) => swatch.name === 'blueberry')?.color)
    expect(colorFor('Fresh mint')).toBe(PALETTE.find((swatch) => swatch.name === 'mint')?.color)
    expect(colorFor('Whole milk')).toBe(PALETTE.find((swatch) => swatch.name === 'cream')?.color)
  })

  test('gives nothing for a name it has no color for', () => {
    expect(colorFor('Mystery')).toBeUndefined()
  })

  test('offers about 16 swatches, each a hex color', () => {
    expect(PALETTE).toHaveLength(16)
    for (const swatch of PALETTE) expect(swatch.color).toMatch(/^#[0-9a-f]{6}$/)
  })
})
