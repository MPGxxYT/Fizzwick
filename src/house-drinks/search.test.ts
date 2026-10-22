import { describe, expect, test } from 'vitest'
import { parseDrinkFile, type Drink } from '../riff-engine'
import cherryLimeadeFile from './cherry-limeade.json'
import { filterChoices, searchDrinks } from './search'

function parse(input: unknown): Drink {
  const result = parseDrinkFile(input)
  if (!result.ok) throw new Error(result.errors.join('\n'))
  return result.drink
}

const cherryLimeade = parse(cherryLimeadeFile)

// Shaken, creamy, with an Option that blends instead, an ingredient that only
// appears in an Option, and a Retired Option.
const mangoCream = parse({
  formatVersion: 1,
  id: 'mango-cream',
  name: 'Mango Cream',
  glass: 'rocks',
  method: 'shake',
  flavorTags: ['creamy', 'fruity'],
  photo: 'photos/mango-cream.jpg',
  ingredients: [{ name: 'whole milk', amount: 3, unit: 'oz' }],
  slots: [
    {
      id: 'fruit',
      label: 'Fruit',
      options: [
        { id: 'mango', label: 'Mango', ingredients: [{ name: 'mango purée', amount: 1, unit: 'oz' }], color: '#f59e0b' },
        { id: 'kiwi', label: 'Kiwi', ingredients: [{ name: 'kiwi purée', amount: 1, unit: 'oz' }], color: '#84cc16', retired: true },
      ],
    },
    {
      id: 'texture',
      label: 'Texture',
      options: [
        { id: 'shaken', label: 'Shaken', ingredients: [], color: '#fef3c7' },
        { id: 'frozen', label: 'Frozen', ingredients: [{ name: 'ice', amount: 1, unit: 'cup' }], method: 'blend', color: '#e0f2fe' },
      ],
    },
  ],
  steps: [{ id: 'make', text: 'Make it with {fruit}.' }],
  houseSpec: { fruit: 'mango', texture: 'shaken' },
})

const drinks = [mangoCream, cherryLimeade]
const names = (found: Drink[]) => found.map((drink) => drink.name)

describe('searchDrinks', () => {
  test('with no search or filters, lists every Drink by name', () => {
    expect(names(searchDrinks(drinks, {}))).toEqual(['Cherry Limeade', 'Mango Cream'])
  })

  test('matches Drink names, ignoring case and extra spaces', () => {
    expect(names(searchDrinks(drinks, { query: '  CHERRY  ' }))).toEqual(['Cherry Limeade'])
  })

  test('matches fixed ingredients', () => {
    expect(names(searchDrinks(drinks, { query: 'lime juice' }))).toEqual(['Cherry Limeade'])
    expect(names(searchDrinks(drinks, { query: 'milk' }))).toEqual(['Mango Cream'])
  })

  test('matches ingredients that only appear in an Option', () => {
    expect(names(searchDrinks(drinks, { query: 'agave' }))).toEqual(['Cherry Limeade'])
    expect(names(searchDrinks(drinks, { query: 'tart cherry' }))).toEqual(['Cherry Limeade'])
  })

  test('matches Option labels', () => {
    expect(names(searchDrinks(drinks, { query: 'frozen' }))).toEqual(['Mango Cream'])
  })

  test('needs every word to match somewhere in the Drink', () => {
    expect(names(searchDrinks(drinks, { query: 'cherry soda' }))).toEqual(['Cherry Limeade'])
    expect(names(searchDrinks(drinks, { query: 'cherry milk' }))).toEqual([])
  })

  test('ignores Retired Options, since they cannot be picked', () => {
    expect(names(searchDrinks(drinks, { query: 'kiwi' }))).toEqual([])
  })

  test('filters by Method, including Methods an Option can switch to', () => {
    expect(names(searchDrinks(drinks, { method: 'build' }))).toEqual(['Cherry Limeade'])
    expect(names(searchDrinks(drinks, { method: 'shake' }))).toEqual(['Mango Cream'])
    expect(names(searchDrinks(drinks, { method: 'blend' }))).toEqual(['Mango Cream'])
    expect(names(searchDrinks(drinks, { method: 'stir' }))).toEqual([])
  })

  test('filters by Flavor Tag', () => {
    expect(names(searchDrinks(drinks, { flavor: 'fruity' }))).toEqual(['Cherry Limeade', 'Mango Cream'])
    expect(names(searchDrinks(drinks, { flavor: 'creamy' }))).toEqual(['Mango Cream'])
  })

  test('combines search and filters', () => {
    expect(names(searchDrinks(drinks, { query: 'ice', method: 'blend' }))).toEqual(['Mango Cream'])
    expect(names(searchDrinks(drinks, { query: 'cherry', flavor: 'creamy' }))).toEqual([])
  })
})

describe('filterChoices', () => {
  test('offers only the Methods and Flavor Tags that some Drink can have, in a fixed order', () => {
    expect(filterChoices(drinks)).toEqual({
      methods: ['build', 'shake', 'blend'],
      flavors: ['citrus', 'fruity', 'creamy'],
    })
  })
})
