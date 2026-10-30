import { describe, expect, test } from 'vitest'
import { parseDrinkFile, type Drink } from '../riff-engine'
import cherryLimeadeFile from './cherry-limeade.json'
import { houseDrinks } from './catalog'
import {
  exactIngredient,
  filterChoices,
  FROM_YOUR_DRINKS,
  groupChoices,
  ingredientChoices,
  searchDrinks,
  toolChoices,
  type ChoiceGroup,
  type IngredientChoice,
} from './search'

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
const names = (found: { drink: Drink }[]) => found.map(({ drink }) => drink.name)
const picksOf = (found: { drink: Drink; picks: Record<string, string | null> }[], name: string) =>
  found.find(({ drink }) => drink.name === name)?.picks

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

  test('opens each Drink on its House Spec when that fits the filters', () => {
    expect(picksOf(searchDrinks(drinks, {}), 'Cherry Limeade')).toEqual(cherryLimeade.houseSpec)
  })

  test('a Method an Option switches to opens on that Riff', () => {
    expect(picksOf(searchDrinks(drinks, { method: 'blend' }), 'Mango Cream')).toEqual({ fruit: 'mango', texture: 'frozen' })
  })
})

describe('the ingredient filter', () => {
  test('finds Drinks whose Riffs use any picked ingredient', () => {
    expect(names(searchDrinks(drinks, { ingredients: ['agave'] }))).toEqual(['Cherry Limeade'])
    expect(names(searchDrinks(drinks, { ingredients: ['agave', 'whole milk'] }))).toEqual(['Cherry Limeade', 'Mango Cream'])
    expect(names(searchDrinks(drinks, { ingredients: ['durian'] }))).toEqual([])
  })

  test('matches whole ingredient names, ignoring case', () => {
    expect(names(searchDrinks(drinks, { ingredients: ['Cherry Syrup'] }))).toEqual(['Cherry Limeade'])
    expect(names(searchDrinks(drinks, { ingredients: ['syrup'] }))).toEqual([])
  })

  test('opens the Riff closest to the House Spec that uses the ingredient', () => {
    expect(picksOf(searchDrinks(drinks, { ingredients: ['agave'] }), 'Cherry Limeade')).toEqual({
      ...cherryLimeade.houseSpec,
      sweetener: 'agave',
    })
    expect(picksOf(searchDrinks(drinks, { ingredients: ['fresh lime juice'] }), 'Cherry Limeade')).toEqual(
      cherryLimeade.houseSpec,
    )
  })

  test('never picks a Retired Option', () => {
    expect(names(searchDrinks(drinks, { ingredients: ['kiwi purée'] }))).toEqual([])
  })
})

describe('the tool filter', () => {
  test('finds Drinks with a Riff that needs only the tools ticked', () => {
    expect(names(searchDrinks(drinks, { tools: ['jigger'] }))).toEqual(['Cherry Limeade'])
    expect(names(searchDrinks(drinks, { tools: ['jigger', 'shaker'] }))).toEqual(['Cherry Limeade', 'Mango Cream'])
  })

  test('counts a barspoon and a strainer as things any kitchen has', () => {
    // Cherry Limeade stirs with a barspoon; Mango Cream strains its shake.
    expect(picksOf(searchDrinks(drinks, { tools: ['jigger'] }), 'Cherry Limeade')).toEqual(cherryLimeade.houseSpec)
    expect(picksOf(searchDrinks(drinks, { tools: ['shaker'] }), 'Mango Cream')).toEqual(mangoCream.houseSpec)
  })

  test('opens on a Riff the tools can make when the House Spec needs more', () => {
    expect(picksOf(searchDrinks(drinks, { tools: ['blender'] }), 'Mango Cream')).toEqual({ fruit: 'mango', texture: 'frozen' })
  })

  test('the ingredient and tool filters must fit the same Riff', () => {
    // Muddled cherries need a muddler and a fine strainer.
    expect(names(searchDrinks(drinks, { ingredients: ['fresh cherries, pitted'], tools: ['jigger'] }))).toEqual([])
    expect(
      names(searchDrinks(drinks, { ingredients: ['fresh cherries, pitted'], tools: ['jigger', 'shaker', 'muddler', 'fine-strainer'] })),
    ).toEqual(['Cherry Limeade'])
    expect(names(searchDrinks(drinks, { method: 'blend', tools: ['shaker'] }))).toEqual([])
  })
})

describe('the ingredient filter, by Bar Item', () => {
  const lemonDrink = (id: string, ingredient: string): Drink => ({
    ...mangoCream,
    id,
    name: id,
    ingredients: [{ name: ingredient, amount: 1, unit: 'oz' }],
  })

  test('picking Lemons finds Drinks using its juice, wheel, wedge or peel', () => {
    const lemons = ['fresh lemon juice', 'lemon wheel', 'lemon wedge', 'lemon peel'].map((name) => lemonDrink(name, name))
    expect(names(searchDrinks(lemons, { ingredients: ['lemons'] }))).toHaveLength(4)
  })

  test('one exact name finds only that name', () => {
    const lemons = [lemonDrink('juice', 'fresh lemon juice'), lemonDrink('wheel', 'lemon wheel')]
    expect(names(searchDrinks(lemons, { ingredients: ['lemon wheel'] }))).toEqual(['wheel'])
  })

  test('a syrup link ticks the syrup, and a wheel link stays exact', () => {
    expect(exactIngredient('raspberry syrup')).toBe('raspberry-syrup')
    expect(exactIngredient('lime wheel')).toBe('lime wheel')
    expect(exactIngredient('durian foam')).toBe('durian foam')
  })
})

describe('ingredientChoices', () => {
  const house = ingredientChoices(houseDrinks)
  const labels = house.map((choice) => choice.label)

  test('offers no water, one Ice and one Lemons', () => {
    expect(labels.filter((label) => /water$/i.test(label))).toEqual(['Soda water', 'Tonic water'])
    expect(labels.filter((label) => /\bice\b/i.test(label))).toEqual(['Ice'])
    expect(labels.filter((label) => /lemon/i.test(label))).toEqual(['Lemon-lime soda', 'Lemons', 'Sparkling lemonade'])
  })

  test('keeps garnish-only items, in their own group', () => {
    expect(house.find((choice) => choice.value === 'pickles')?.group).toBe('Garnishes')
  })

  test('every House Drink ingredient lands in a Bar Item group', () => {
    expect(groupChoices(house).map(({ group }) => group)).not.toContain(FROM_YOUR_DRINKS)
  })

  test('leaves out Retired Options, and lists each item once in name order', () => {
    const fixture = ingredientChoices(drinks)
    expect(fixture.filter((choice) => choice.value === 'limes')).toHaveLength(1)
    expect(fixture.map((choice) => choice.value)).toContain('whole-milk')
    expect(fixture.map((choice) => choice.value)).not.toContain('kiwi purée')
    const sorted = fixture.map((choice) => choice.label)
    expect(sorted).toEqual([...sorted].sort((a, b) => a.localeCompare(b)))
  })

  test('a name no Bar Item covers shows under From your drinks', () => {
    const custom: Drink = { ...mangoCream, ingredients: [{ name: 'Charred Lemon Wheel', amount: 1, unit: 'count' }] }
    const choice = ingredientChoices([custom]).find((c) => c.value === 'charred lemon wheel')
    expect(choice).toMatchObject({ label: 'Charred lemon wheel', group: FROM_YOUR_DRINKS })
  })
})

describe('groupChoices', () => {
  test('keeps the groups in a fixed order, and From your drinks last', () => {
    const choice = (value: string, group: ChoiceGroup): IngredientChoice => ({ value, label: value, group, names: [value] })
    expect(
      groupChoices([choice('mine', FROM_YOUR_DRINKS), choice('pickles', 'Garnishes'), choice('agave', 'Syrups and sweeteners')]).map(
        ({ group }) => group,
      ),
    ).toEqual(['Syrups and sweeteners', 'Garnishes', FROM_YOUR_DRINKS])
  })
})

describe('toolChoices', () => {
  test('offers the tools some Riff needs, leaving out those a kitchen has a stand-in for', () => {
    expect(toolChoices(drinks)).toEqual(['jigger', 'shaker', 'fine-strainer', 'muddler', 'blender'])
    expect(toolChoices(houseDrinks)).toEqual(['jigger', 'shaker', 'fine-strainer', 'muddler', 'blender'])
  })

  test('a kettle, peeler or mixing glass never hides a Drink', () => {
    const needs: Drink = {
      ...cherryLimeade,
      steps: [{ id: 'all', text: 'Boil, peel and stir.', tools: ['kettle', 'peeler', 'mixing-glass'] }],
    }
    expect(picksOf(searchDrinks([needs], { tools: ['jigger'] }), needs.name)).toEqual(needs.houseSpec)
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
