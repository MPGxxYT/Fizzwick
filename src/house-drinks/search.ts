import { FLAVOR_TAGS, METHODS, type Drink, type FlavorTag, type Method } from '../riff-engine'

export interface DrinkSearch {
  query?: string
  method?: Method
  flavor?: FlavorTag
}

// Options that can still be picked. Retired ones only live on in Favorites.
const pickable = (drink: Drink) => drink.slots.flatMap((slot) => slot.options.filter((option) => !option.retired))

// Every Method a Drink can be made with: its own, plus any an Option switches to.
function methodsOf(drink: Drink): Set<Method> {
  return new Set([drink.method, ...pickable(drink).flatMap((option) => (option.method ? [option.method] : []))])
}

// Everything a search can match: the name, every ingredient (fixed or in an
// Option), and every Option label.
function searchableText(drink: Drink): string {
  const options = pickable(drink)
  return [
    drink.name,
    ...drink.ingredients.map((ingredient) => ingredient.name),
    ...options.flatMap((option) => [option.label, ...option.ingredients.map((ingredient) => ingredient.name)]),
  ]
    .join(' \n ')
    .toLowerCase()
}

// The Drinks that match every word of the query and the chosen filters,
// sorted by name.
export function searchDrinks(drinks: Drink[], { query = '', method, flavor }: DrinkSearch): Drink[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  return drinks
    .filter((drink) => {
      if (method && !methodsOf(drink).has(method)) return false
      if (flavor && !drink.flavorTags.includes(flavor)) return false
      const text = searchableText(drink)
      return words.every((word) => text.includes(word))
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

// The Methods and Flavor Tags worth offering as filters: only those some
// Drink can have, so no filter ever leads to an empty list on its own.
export function filterChoices(drinks: Drink[]): { methods: Method[]; flavors: FlavorTag[] } {
  const methods = new Set(drinks.flatMap((drink) => [...methodsOf(drink)]))
  const flavors = new Set(drinks.flatMap((drink) => drink.flavorTags))
  return {
    methods: METHODS.filter((method) => methods.has(method)),
    flavors: FLAVOR_TAGS.filter((flavor) => flavors.has(flavor)),
  }
}
