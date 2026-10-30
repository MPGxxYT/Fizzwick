import type { Ingredient, Option, Step } from './drink-format'

// One of a Riff's ingredients, already scaled, and where it came from.
export interface IngredientSource {
  ingredient: Ingredient
  garnish: boolean
  slotId: string | null
  option: Option | null
}

// A step as written, and its text with the placeholders filled in.
export interface WrittenStep {
  step: Step
  text: string
}

// Words too common to identify an ingredient alone: "fresh lime juice" shouldn't
// count as named by a step that says "cranberry juice".
const GENERIC_WORDS = new Set([
  'chunks',
  'cream',
  'juice',
  'leaves',
  'milk',
  'peel',
  'slice',
  'slices',
  'soda',
  'sprig',
  'sprigs',
  'syrup',
  'tea',
  'water',
  'wedge',
  'wheel',
])

// A step that takes time before the drink can be made, such as tea that has
// to brew and chill. The Drink page shows it above the ingredients, so it
// isn't a surprise in step mode.
export function isMakeAhead(step: { text: string }): boolean {
  return /\bmake it ahead\b/i.test(step.text)
}

// Steps are written text with no link to the ingredients, so this works out
// which step each amount belongs on: the first one that names the ingredient,
// which is when you need it in hand. Later steps only mention it again ("so
// the syrup mixes in"). Returns the ingredients for each step, in order.
//
// Only ingredients with an amount are placed. Top, to taste and fill have no
// number to show, and the step already says what to do. An ingredient no step
// names is left out here and still shows in the Mise en Place.
export function placeIngredients(steps: WrittenStep[], sources: IngredientSource[]): Ingredient[][] {
  const placed = steps.map((): Ingredient[] => [])
  for (const source of sources) {
    if (source.ingredient.amount === undefined) continue
    const at = steps.findIndex((written) => !isMakeAhead(written) && usesIngredient(written, source))
    if (at !== -1) placed[at].push(source.ingredient)
  }
  return placed
}

function usesIngredient({ step, text }: WrittenStep, { ingredient, garnish, slotId, option }: IngredientSource): boolean {
  // A garnish goes on at the end, even if an earlier step names the same fruit.
  if (garnish && step.when?.slot !== 'garnish' && !/garnish/i.test(step.text)) return false
  if (slotId && option) {
    if (step.when?.slot === slotId && step.when.option === option.id) return true
    if (step.text.includes(`{${slotId}}`)) {
      // The placeholder stands for the whole Option. With several ingredients
      // it only covers those its wording names: {herb} reading "mint" covers
      // the mint leaves and the mint sprig, not a side of syrup.
      const phrase = (option.phrase ?? option.label).toLowerCase()
      if (option.ingredients.length === 1 || ingredient.name.toLowerCase().includes(phrase)) return true
    }
  }
  return namedIn(ingredient.name, text)
}

// Whether the text names the ingredient, leaving off words at the front and
// anything after a comma: "fresh lime juice" is named by "lime juice", and
// "espresso, cooled a little" by "espresso".
function namedIn(name: string, text: string): boolean {
  const words = name.toLowerCase().split(',')[0].trim().split(/\s+/)
  const haystack = ` ${text.toLowerCase().replace(/[.,:;]/g, ' ')} `
  return words.some((_word, i) => {
    const tail = words.slice(i)
    if (tail.length === 1 && GENERIC_WORDS.has(tail[0])) return false
    return haystack.includes(` ${tail.join(' ')} `)
  })
}
