import { describe, expect, test } from 'vitest'
import { parseDrinkFile, resolveRiff, type Drink, type Picks } from '../riff-engine'
import { findHouseDrink, houseDrinks } from './catalog'
import { softerCitrus, softerHouseDrinks } from './softer-citrus'

const amounts = (drink: Drink, picks: Picks = {}, glassOz?: number) =>
  Object.fromEntries(resolveRiff(drink, picks, { glassOz }).ingredients.map((item) => [item.name, item.amount]))

const softer = (id: string) => softerCitrus(findHouseDrink(id)!)

describe('Softer citrus', () => {
  test.each([
    ['blueberry-fizz', {}, { 'fresh lemon juice': 0.5, 'honey syrup': 0.75 }],
    ['cherry-limeade', { sweetener: 'agave' }, { 'fresh lime juice': 0.75, agave: 0.25 }],
    ['citrus-spritz', { sweetener: 'agave' }, { agave: 0.25 }],
    ['frozen-lemonade', {}, { 'fresh lemon juice': 0.75, 'simple syrup': 1 }],
    ['frozen-lemonade', { sweetener: 'agave' }, { 'fresh lemon juice': 0.75, agave: 0.5 }],
    ['garden-smash', {}, { 'fresh lemon juice': 0.5, 'simple syrup': 0.75, 'soda water': 2 }],
    ['garden-smash', { citrus: 'lime-juice' }, { 'fresh lime juice': 0.5 }],
    ['ginger-toddy', { sweetener: 'ginger-syrup' }, { 'ginger syrup': 1.5 }],
    ['lavender-lemon-fizz', {}, { 'fresh lemon juice': 0.5, 'lavender syrup': 0.75 }],
    ['lavender-lemon-fizz', { sweetener: 'honey-syrup' }, { 'honey syrup': 0.75 }],
    ['nojito', {}, { 'fresh lime juice': 0.5, 'simple syrup': 0.75 }],
    ['nojito', { sweetener: 'agave' }, { agave: 0.25 }],
    ['porch-tea', {}, { 'fresh lemon juice': 0.5, 'simple syrup': 0.75, 'cold water': 1.75 }],
    ['raspberry-clover', {}, { 'fresh lemon juice': 0.5 }],
    ['watermelon-cooler', {}, { 'fresh lime juice': 0.25 }],
  ] as [string, Picks, Record<string, number>][])('%s %j', (id, picks, expected) => {
    expect(amounts(softer(id), picks)).toMatchObject(expected)
  })

  test('still scales to the glass', () => {
    expect(amounts(softer('blueberry-fizz'), {}, 16)).toMatchObject({ 'fresh lemon juice': 0.75, 'honey syrup': 1.25 })
  })

  test('Garden Smash adds the soda water before the garnish', () => {
    const steps = resolveRiff(softer('garden-smash')).steps.map((step) => step.id)
    expect(steps.slice(-3)).toEqual(['double-strain', 'add-soda', 'garnish'])
  })

  test('every changed House Drink is still a valid Drink', () => {
    for (const drink of softerHouseDrinks) expect(parseDrinkFile(drink).ok).toBe(true)
  })

  test('a Drink with no changes comes back as it is, Custom Drinks included', () => {
    const virginMary = findHouseDrink('virgin-mary')!
    expect(softerCitrus(virginMary)).toBe(virginMary)
    const custom = { ...virginMary, id: 'custom-abc12345' }
    expect(softerCitrus(custom)).toBe(custom)
  })

  test('leaves the catalog itself alone', () => {
    expect(amounts(findHouseDrink('blueberry-fizz')!)).toMatchObject({ 'fresh lemon juice': 0.75 })
    expect(houseDrinks.length).toBe(softerHouseDrinks.length)
  })
})
