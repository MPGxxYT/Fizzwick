import { describe, expect, test } from 'vitest'
import type { Drink, Ingredient } from './drink-format'
import { resolveRiff, type Picks, type RiffSettings } from './resolve-riff'

const oz = (name: string, amount: number): Ingredient => ({ name, amount, unit: 'oz' })
const count = (name: string, amount: number): Ingredient => ({ name, amount, unit: 'count' })

const drink: Drink = {
  formatVersion: 1,
  id: 'test-smash',
  name: 'Test Smash',
  glass: 'rocks',
  method: 'build',
  flavorTags: ['citrus'],
  ingredients: [oz('fresh lime juice', 1), { name: 'ice', unit: 'fill' }],
  slots: [
    {
      id: 'tea',
      label: 'Tea',
      options: [{ id: 'black', label: 'Black', phrase: 'black tea', ingredients: [oz('chilled strong black tea', 2)], color: '#000000' }],
    },
    {
      id: 'herb',
      label: 'Herb',
      options: [
        {
          id: 'mint',
          label: 'Mint',
          phrase: 'mint',
          ingredients: [count('mint leaves', 6), count('mint sprig, for garnish', 1)],
          color: '#00ff00',
        },
      ],
    },
    {
      id: 'fizz',
      label: 'Fizz',
      options: [{ id: 'soda', label: 'Soda water', phrase: 'soda water', ingredients: [{ name: 'soda water', unit: 'top' }], color: '#ffffff' }],
    },
    {
      id: 'garnish',
      label: 'Garnish',
      optional: true,
      options: [
        { id: 'lime', label: 'Lime', phrase: 'a lime wheel', ingredients: [count('lime wheel', 1)], color: '#00ff00' },
        { id: 'peel', label: 'Peel', ingredients: [count('lime peel', 1)], color: '#00ff00' },
      ],
    },
  ],
  steps: [
    { id: 'brew', text: 'Steep the {tea}, then chill it. Make it ahead if you can.' },
    { id: 'muddle', text: 'Muddle the {herb} with the lime juice.' },
    { id: 'pour', text: 'Pour in the {tea}.' },
    { id: 'stir', text: 'Stir so the {tea} and lime juice mix.' },
    { id: 'fill', text: 'Fill the glass with ice.' },
    { id: 'top', text: 'Top with {fizz}.' },
    { id: 'garnish', text: 'Garnish with a sprig of {herb} and {garnish}.', when: { slot: 'garnish', option: 'lime' } },
    { id: 'peel', text: 'Twist the peel over the top.', when: { slot: 'garnish', option: 'peel' } },
  ],
  houseSpec: { tea: 'black', herb: 'mint', fizz: 'soda', garnish: 'lime' },
}

// Each step's id and what it shows, leaving out steps that show nothing.
const shown = (picks?: Picks, settings?: RiffSettings) =>
  Object.fromEntries(
    resolveRiff(drink, picks, settings)
      .steps.filter((step) => step.ingredients.length > 0)
      .map((step) => [step.id, step.ingredients.map(({ name, amount, unit }) => `${amount} ${unit} ${name}`)]),
  )

describe('the amounts on each step', () => {
  test('an amount goes on the first step that names it, not on later mentions', () => {
    expect(shown()).toMatchObject({
      muddle: ['1 oz fresh lime juice', '6 count mint leaves'],
      pour: ['2 oz chilled strong black tea'],
    })
    expect(shown()).not.toHaveProperty('stir')
  })

  test('a step that makes something ahead shows no amount', () => {
    expect(shown()).not.toHaveProperty('brew')
  })

  test('Top and fill have no amount to show', () => {
    expect(shown()).not.toHaveProperty('top')
    expect(shown()).not.toHaveProperty('fill')
  })

  test('a garnish waits for the garnish step, even when an earlier step fits its Option', () => {
    expect(shown().garnish).toEqual(['1 count mint sprig, for garnish', '1 count lime wheel'])
  })

  test('the Option picked decides what shows, and a step only for that Option gets its ingredient', () => {
    expect(shown({ garnish: 'peel' }).peel).toEqual(['1 count lime peel'])
    expect(shown({ garnish: null })).not.toHaveProperty('garnish')
  })

  test('amounts follow the servings, the units and the glass', () => {
    expect(shown(undefined, { servings: 2 }).pour).toEqual(['4 oz chilled strong black tea'])
    expect(shown(undefined, { servings: 2 }).garnish).toEqual(['2 count mint sprig, for garnish', '2 count lime wheel'])
    expect(shown(undefined, { units: 'ml' }).pour).toEqual(['60 ml chilled strong black tea'])
    expect(shown(undefined, { glassOz: 16 }).pour).toEqual(['4 oz chilled strong black tea'])
  })

  test('an ingredient no step names shows only in the Mise en Place', () => {
    const riff = resolveRiff({ ...drink, ingredients: [...drink.ingredients, oz('rose water', 0.25)] })
    expect(riff.steps.flatMap((step) => step.ingredients).map(({ name }) => name)).not.toContain('rose water')
    expect(riff.miseEnPlace.ingredients.map(({ name }) => name)).toContain('rose water')
  })
})
