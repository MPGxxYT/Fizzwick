import { describe, expect, it } from 'vitest'
import { titleLines } from './format'

describe('the lines a Drink name is set on', () => {
  it('gives one or two words a line each', () => {
    expect(titleLines('Nojito')).toEqual(['Nojito'])
    expect(titleLines('Garden Smash')).toEqual(['Garden', 'Smash'])
  })

  it('sets longer names on two lines of close length, the shorter first on a tie', () => {
    expect(titleLines('Black Tea Old Fashioned')).toEqual(['Black Tea', 'Old Fashioned'])
    expect(titleLines('Sparkling Mint Lemonade')).toEqual(['Sparkling', 'Mint Lemonade'])
  })
})
