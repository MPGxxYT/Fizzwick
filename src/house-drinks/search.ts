import {
  FLAVOR_TAGS,
  METHODS,
  resolveRiff,
  TOOLS,
  type Drink,
  type FlavorTag,
  type Ingredient,
  type Method,
  type Picks,
  type Slot,
  type Tool,
} from '../riff-engine'
import {
  BAR_GROUPS,
  barItemById,
  barItemFor,
  COUNTS_AS_ON_HAND,
  COUNTS_AS_OWN,
  countedAs,
  namesOf,
  type BarGroup,
  type BarItem,
} from '../my-bar/bar-items'
import type { MyBar } from '../my-bar/my-bar'

export interface DrinkSearch {
  query?: string
  method?: Method
  flavor?: FlavorTag
  // Show Drinks with a Riff that uses any of these: Bar Item IDs or exact names.
  ingredients?: string[]
  // Show Drinks with a Riff that needs only these tools (and kitchen ones).
  tools?: Tool[]
  // Show Drinks with a Riff you can make from My Bar and the kitchen's stand-ins.
  myBar?: MyBar
}

// A Drink the search found, with the Riff to open it on: the House Spec when
// it fits the filters, otherwise the fitting Riff that swaps the fewest Slots.
export interface FoundDrink {
  drink: Drink
  picks: Picks
  // Every Riff that fits, closest to the House Spec first.
  fitting: Picks[]
}

// The tools to tick on My Bar: all but the ones a kitchen has a stand-in for.
export const barTools = () => TOOLS.filter((tool) => !KITCHEN_TOOLS.includes(tool))

// One row of the ingredient filter. `value` goes in the address, and `names`
// are the wordings a search of the filter can find it by.
export interface IngredientChoice {
  value: string
  label: string
  group: ChoiceGroup
  names: string[]
}

export const FROM_YOUR_DRINKS = 'From your drinks' as const
export type ChoiceGroup = BarGroup | typeof FROM_YOUR_DRINKS

// Tools the tool filter never hides a Drink for, since a kitchen has a stand-in:
// any long spoon stirs, a shaker's lid strains, a pot boils water, a knife
// peels, and a pint glass stirs.
export const KITCHEN_TOOLS: readonly Tool[] = ['barspoon', 'strainer', 'kettle', 'peeler', 'mixing-glass']

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
  ingredients: Ingredient[]
  // What the ingredient filter can find it by: each name, and its Bar Item.
  filterValues: Set<string>
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
        ingredients: riff.ingredients,
        filterValues: new Set(
          riff.ingredients.flatMap((ingredient) => {
            const counted = countedAs(ingredient)
            return typeof counted === 'string' ? [name(ingredient)] : [name(ingredient), counted.id]
          }),
        ),
      }
    })
  riffCache.set(drink, riffs)
  return riffs
}

// Whether My Bar lacks these. Water and garnishes never stop you, and neither
// does a tool a kitchen has a stand-in for.
const lacksTool = (tool: Tool, myBar: MyBar) => !myBar.tools.includes(tool) && !KITCHEN_TOOLS.includes(tool)

function lacksIngredient(ingredient: Ingredient, myBar: MyBar): boolean {
  const counted = countedAs(ingredient)
  if (counted === COUNTS_AS_ON_HAND) return false
  if (counted === COUNTS_AS_OWN) return !myBar.items.includes(name(ingredient))
  if (counted.garnishes?.includes(name(ingredient))) return false
  return !myBar.items.includes(counted.id)
}

// A Riff you have everything for.
const canMake = (riff: RiffFacts, myBar: MyBar) =>
  !riff.tools.some((tool) => lacksTool(tool, myBar)) &&
  !riff.ingredients.some((ingredient) => lacksIngredient(ingredient, myBar))

// The Options of a Slot that need something My Bar lacks: one of their own
// ingredients, or a tool that only some choices in the Slot need. A tool every
// choice needs isn't this Slot's doing, so swapping wouldn't help.
export function optionsNotInMyBar(drink: Drink, picks: Picks, slot: Slot, myBar: MyBar): Set<string> {
  const toolsWith = (choice: string | null) => resolveRiff(drink, { ...picks, [slot.id]: choice }).miseEnPlace.tools
  const choices = [...slot.options.map((option) => option.id), ...(slot.optional ? [null] : [])]
  const everyChoice = choices
    .map(toolsWith)
    .reduce((shared, tools) => shared.filter((tool) => tools.includes(tool)))
  return new Set(
    slot.options
      .filter(
        (option) =>
          option.ingredients.some((ingredient) => lacksIngredient(ingredient, myBar)) ||
          toolsWith(option.id).some((tool) => !everyChoice.includes(tool) && lacksTool(tool, myBar)),
      )
      .map((option) => option.id),
  )
}

// The Drinks that match every word of the query and the chosen filters,
// sorted by name. The Method, ingredient and tool filters must all fit the
// same Riff, which is the one the Drink opens on.
export function searchDrinks(
  drinks: Drink[],
  { query = '', method, flavor, ingredients = [], tools, myBar }: DrinkSearch,
): FoundDrink[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  // A value is a Bar Item ID or one exact name.
  const wanted = ingredients.map((value) => value.toLowerCase())
  const owned = tools && new Set([...tools, ...KITCHEN_TOOLS])
  const fits = (riff: RiffFacts) =>
    (!method || riff.method === method) &&
    (wanted.length === 0 || wanted.some((value) => riff.filterValues.has(value))) &&
    (!owned || riff.tools.every((tool) => owned.has(tool))) &&
    (!myBar || canMake(riff, myBar))

  return drinks
    .flatMap((drink) => {
      if (flavor && !drink.flavorTags.includes(flavor)) return []
      const text = searchableText(drink)
      if (!words.every((word) => text.includes(word))) return []
      const fitting = riffsOf(drink)
        .filter(fits)
        .map((riff) => riff.picks)
      return fitting.length > 0 ? [{ drink, picks: fitting[0], fitting }] : []
    })
    .sort((a, b) => a.drink.name.localeCompare(b.drink.name))
}

// A random Riff that fits, from a random Drink in the list. The last Drink
// picked sits out, unless it's the only one.
export function surprisePick(
  found: FoundDrink[],
  lastDrinkId: string | undefined,
  random: () => number = Math.random,
): { drink: Drink; picks: Picks } | null {
  const others = found.filter(({ drink }) => drink.id !== lastDrinkId)
  const pool = others.length > 0 ? others : found
  if (pool.length === 0) return null
  const { drink, fitting } = pool[Math.floor(random() * pool.length)]
  return { drink, picks: fitting[Math.floor(random() * fitting.length)] }
}

// Every ingredient a Riff can use.
const ingredientsOf = (drinks: Drink[]) =>
  drinks.flatMap((drink) => [...drink.ingredients, ...pickable(drink).flatMap((option) => option.ingredients)])

// Every ingredient a Riff can use, once each, by name.
export function ingredientNames(drinks: Drink[]): string[] {
  return [...new Set(ingredientsOf(drinks).map(name))].sort((a, b) => a.localeCompare(b))
}

// The ingredient filter's list: each Bar Item some Riff can use, and each
// ingredient that counts as its own item. Always on hand is never offered.
export function ingredientChoices(drinks: Drink[]): IngredientChoice[] {
  const items = new Map<BarItem, Set<string>>()
  const own = new Set<string>()
  for (const ingredient of ingredientsOf(drinks)) {
    const counted = countedAs(ingredient)
    if (counted === COUNTS_AS_OWN) own.add(name(ingredient))
    else if (counted !== COUNTS_AS_ON_HAND) {
      items.set(counted, (items.get(counted) ?? new Set(namesOf(counted))).add(name(ingredient)))
    }
  }
  return [
    ...[...items].map(([item, names]) => ({ value: item.id, label: item.label, group: item.group, names: [...names] })),
    ...[...own].map((ingredient) => ({
      value: ingredient,
      label: ingredientLabel(ingredient),
      group: FROM_YOUR_DRINKS,
      names: [ingredient],
    })),
  ].sort((a, b) => a.label.localeCompare(b.label))
}

// What to call a value of the ingredient filter: a Bar Item ID or a name.
export const ingredientLabel = (value: string) => barItemById(value)?.label ?? value[0].toUpperCase() + value.slice(1)

// The filter value for exactly one ingredient name: its Bar Item when the
// item is nothing but that name, so a syrup's link ticks the syrup's chip. A
// lime wheel stays a name, since Limes also finds lime juice.
export function exactIngredient(ingredient: string): string {
  const item = barItemFor(ingredient)
  return item && namesOf(item).length === 1 ? item.id : ingredient
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

// Ingredient choices in their groups, groups in a fixed order, empty ones left out.
export function groupChoices(choices: IngredientChoice[]): { group: ChoiceGroup; choices: IngredientChoice[] }[] {
  return [...BAR_GROUPS, FROM_YOUR_DRINKS]
    .map((group) => ({ group, choices: choices.filter((choice) => choice.group === group) }))
    .filter(({ choices }) => choices.length > 0)
}
