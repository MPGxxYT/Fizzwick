import {
  FLAVOR_TAGS,
  METHODS,
  resolveRiff,
  TOOLS,
  type Drink,
  type FlavorTag,
  type Method,
  type Picks,
  type Tool,
} from '../riff-engine'

export interface DrinkSearch {
  query?: string
  method?: Method
  flavor?: FlavorTag
  // Show Drinks with a Riff that uses any of these ingredients.
  ingredients?: string[]
  // Show Drinks with a Riff that needs only these tools (and kitchen ones).
  tools?: Tool[]
}

// A Drink the search found, with the Riff to open it on: the House Spec when
// it fits the filters, otherwise the fitting Riff that swaps the fewest Slots.
export interface FoundDrink {
  drink: Drink
  picks: Picks
}

// Tools the tool filter never hides a Drink for: any long spoon stirs, and a
// shaker's lid strains.
export const KITCHEN_TOOLS: readonly Tool[] = ['barspoon', 'strainer']

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

interface RiffFacts {
  picks: Picks
  method: Method
  tools: Tool[]
  ingredients: Set<string>
}

const name = (ingredient: { name: string }) => ingredient.name.toLowerCase()

// Every Riff of a Drink that can be picked (no Retired Options), closest to
// the House Spec first. Worked out once per Drink, since the list searches
// again on every keystroke.
const riffCache = new WeakMap<Drink, RiffFacts[]>()

function riffsOf(drink: Drink): RiffFacts[] {
  const cached = riffCache.get(drink)
  if (cached) return cached
  let combinations: Picks[] = [{}]
  for (const slot of drink.slots) {
    const choices: (string | null)[] = slot.options.filter((option) => !option.retired).map((option) => option.id)
    if (slot.optional) choices.push(null)
    combinations = combinations.flatMap((picks) => choices.map((choice) => ({ ...picks, [slot.id]: choice })))
  }
  const swaps = (picks: Picks) => drink.slots.filter((slot) => picks[slot.id] !== drink.houseSpec[slot.id]).length
  const riffs = combinations
    .map((picks, order) => ({ picks, order, swaps: swaps(picks) }))
    .sort((a, b) => a.swaps - b.swaps || a.order - b.order)
    .map(({ picks }) => {
      const riff = resolveRiff(drink, picks)
      return {
        picks: riff.picks,
        method: riff.method,
        tools: riff.miseEnPlace.tools,
        ingredients: new Set(riff.ingredients.map(name)),
      }
    })
  riffCache.set(drink, riffs)
  return riffs
}

// The Drinks that match every word of the query and the chosen filters,
// sorted by name. The Method, ingredient and tool filters must all fit the
// same Riff, which is the one the Drink opens on.
export function searchDrinks(
  drinks: Drink[],
  { query = '', method, flavor, ingredients = [], tools }: DrinkSearch,
): FoundDrink[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const wanted = new Set(ingredients.map((ingredient) => ingredient.toLowerCase()))
  const owned = tools && new Set([...tools, ...KITCHEN_TOOLS])
  const fits = (riff: RiffFacts) =>
    (!method || riff.method === method) &&
    (wanted.size === 0 || [...wanted].some((ingredient) => riff.ingredients.has(ingredient))) &&
    (!owned || riff.tools.every((tool) => owned.has(tool)))

  return drinks
    .flatMap((drink) => {
      if (flavor && !drink.flavorTags.includes(flavor)) return []
      const text = searchableText(drink)
      if (!words.every((word) => text.includes(word))) return []
      const riff = riffsOf(drink).find(fits)
      return riff ? [{ drink, picks: riff.picks }] : []
    })
    .sort((a, b) => a.drink.name.localeCompare(b.drink.name))
}

// Every ingredient a Riff can use, once each, by name.
export function ingredientChoices(drinks: Drink[]): string[] {
  const names = new Set(
    drinks.flatMap((drink) => [
      ...drink.ingredients.map(name),
      ...pickable(drink).flatMap((option) => option.ingredients.map(name)),
    ]),
  )
  return [...names].sort((a, b) => a.localeCompare(b))
}

// The tools worth offering in the tool filter: those some Riff needs, less
// the kitchen ones, in a fixed order.
export function toolChoices(drinks: Drink[]): Tool[] {
  const needed = new Set(drinks.flatMap((drink) => riffsOf(drink).flatMap((riff) => riff.tools)))
  return TOOLS.filter((tool) => needed.has(tool) && !KITCHEN_TOOLS.includes(tool))
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

// Groups for browsing ingredients, in the order the picker shows them.
export const INGREDIENT_GROUPS = [
  'Syrups and sweeteners',
  'Juices',
  'Fruit and vegetables',
  'Herbs, spices and bitters',
  'Milk, cream and egg',
  'Tea and coffee',
  'Sodas and tonics',
  'Garnishes',
  'Ice and water',
  'Other',
] as const
export type IngredientGroup = (typeof INGREDIENT_GROUPS)[number]

// Which group a name falls in: the first rule that matches. The order
// matters, so "soda water" is a soda before it is water, and "mint sprig,
// for garnish" is a garnish before it is an herb. A House Drink test fails
// when a new ingredient lands in Other.
const GROUP_RULES: [IngredientGroup, RegExp][] = [
  ['Sodas and tonics', /soda|tonic|ginger ale|ginger beer|sparkling/],
  ['Ice and water', /\bice\b|water$/],
  ['Juices', /juice|purée/],
  ['Syrups and sweeteners', /syrup|agave|honey|grenadine|sweetener/],
  ['Tea and coffee', /\btea\b|rooibos|lapsang|coffee|espresso|cold brew/],
  ['Garnishes', /garnish|wheel|wedge|peel|pick$|cherry$|slice$|ribbons|stalk|spear|candied|flakes|sprig$|stick$/],
  ['Milk, cream and egg', /milk|cream|half-and-half|yogurt|egg|aquafaba/],
  ['Herbs, spices and bitters', /leaves|sprigs|ground|cloves|salt|pepper|nutmeg|tajín|hot sauce|horseradish|bitters|extract/],
  ['Fruit and vegetables', /berr|cherries|mango|watermelon|cucumber|apple|pear|lemon|lime|orange/],
]

// Ingredient names in their groups, groups in a fixed order, empty ones left out.
export function groupIngredients(names: string[]): { group: IngredientGroup; names: string[] }[] {
  const groupOf = (name: string) => GROUP_RULES.find(([, rule]) => rule.test(name))?.[0] ?? 'Other'
  return INGREDIENT_GROUPS.map((group) => ({ group, names: names.filter((name) => groupOf(name) === group) })).filter(
    ({ names }) => names.length > 0,
  )
}
