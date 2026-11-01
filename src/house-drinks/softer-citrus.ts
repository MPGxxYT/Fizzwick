import type { Drink, Ingredient } from '../riff-engine'
import { houseDrinks } from './catalog'

// The Softer citrus setting's amounts, per standard glass, by ingredient name
// wherever it appears in the Drink. Why each one: docs/research/citrus-levels.md.
const AMOUNTS: Record<string, Record<string, number>> = {
  'blueberry-fizz': { 'fresh lemon juice': 0.5 },
  'cherry-limeade': { agave: 0.25 },
  'citrus-spritz': { agave: 0.25 },
  'frozen-lemonade': { 'fresh lemon juice': 0.75, 'simple syrup': 1 },
  'garden-smash': { 'fresh lemon juice': 0.5, 'fresh lime juice': 0.5 },
  'ginger-toddy': { 'ginger syrup': 1.5 },
  'lavender-lemon-fizz': { 'fresh lemon juice': 0.5, 'lavender syrup': 0.75, 'honey syrup': 0.75 },
  nojito: { 'fresh lime juice': 0.5, agave: 0.25 },
  'porch-tea': { 'fresh lemon juice': 0.5, 'cold water': 1.75 },
  'raspberry-clover': { 'fresh lemon juice': 0.5 },
  'watermelon-cooler': { 'fresh lime juice': 0.25 },
}

// Garden Smash has the least liquid to spread its citrus through, so it also
// gains some soda water.
function addSoda(drink: Drink): Drink {
  const garnish = drink.steps.findIndex((step) => step.id === 'garnish')
  return {
    ...drink,
    ingredients: [...drink.ingredients, { name: 'soda water', amount: 2, unit: 'oz' }],
    steps: [
      ...drink.steps.slice(0, garnish),
      { id: 'add-soda', text: 'Pour the soda water over the top and stir once with a barspoon.', tools: ['barspoon'] },
      ...drink.steps.slice(garnish),
    ],
  }
}

// A Drink with the Softer citrus amounts. One with none comes back as it is.
export function softerCitrus(drink: Drink): Drink {
  const amounts = AMOUNTS[drink.id]
  if (!amounts) return drink
  const change = (ingredient: Ingredient): Ingredient =>
    ingredient.name in amounts ? { ...ingredient, amount: amounts[ingredient.name] } : ingredient
  const changed: Drink = {
    ...drink,
    ingredients: drink.ingredients.map(change),
    slots: drink.slots.map((slot) => ({
      ...slot,
      options: slot.options.map((option) => ({ ...option, ingredients: option.ingredients.map(change) })),
    })),
  }
  return drink.id === 'garden-smash' ? addSoda(changed) : changed
}

export const softerHouseDrinks: Drink[] = houseDrinks.map(softerCitrus)
