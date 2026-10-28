import {
  DIETARY_TAGS,
  type DietaryTag,
  type Drink,
  type Glass,
  type Ingredient,
  type Method,
  type Option,
  type Step,
  type Tool,
} from './drink-format'

// The Option ID picked for each Slot, or null for an empty optional Slot.
export type Picks = Record<string, string | null>

export type Units = 'oz' | 'ml'

export interface RiffSettings {
  servings?: number // 1 to 12, default 1
  units?: Units // default oz
  glassOz?: number // the user's own glass, 2 to 64 oz; default the glass's standard size
}

// The size a recipe for each glass is written for.
export const GLASS_SIZES_OZ: Record<Glass, number> = {
  collins: 12,
  highball: 10,
  rocks: 8,
  coupe: 6,
  mug: 16,
  hurricane: 15,
}

export const MAX_SERVINGS = 12

export interface RiffStep {
  id: string
  text: string
  tools: Tool[]
  durationSeconds?: number
}

export interface RiffSlot {
  id: string
  label: string
  option: { id: string; label: string; retired: boolean } | null
}

export interface Riff {
  drinkId: string
  name: string
  glass: Glass
  method: Method
  servings: number
  units: Units
  picks: Picks
  slots: RiffSlot[]
  ingredients: Ingredient[]
  steps: RiffStep[]
  glassOz: number
  miseEnPlace: { glass: Glass; glassCount: number; tools: Tool[]; ingredients: Ingredient[] }
  batchNotes: string[]
  dietaryTags: DietaryTag[]
  colors: string[]
  isHouseSpec: boolean
  defaultFavoriteName: string
}

export const METHOD_TOOLS: Record<Method, Tool[]> = {
  build: [],
  shake: ['shaker', 'strainer'],
  'dry-shake': ['shaker', 'strainer'],
  stir: ['mixing-glass', 'barspoon', 'strainer'],
  blend: ['blender'],
}

// How many drinks fit in one round of each Method's vessel, and what to say
// when a batch is bigger. Build has no limit.
const BATCH_LIMITS: Partial<Record<Method, { size: number; note: (rounds: number) => string }>> = {
  shake: { size: 2, note: (rounds) => `A shaker holds about 2 drinks, so shake in ${rounds} rounds.` },
  'dry-shake': { size: 2, note: (rounds) => `A shaker holds about 2 drinks, so shake in ${rounds} rounds.` },
  stir: { size: 2, note: (rounds) => `A mixing glass holds about 2 drinks, so stir in ${rounds} rounds.` },
  blend: { size: 4, note: (rounds) => `A blender holds about 4 drinks, so blend in ${rounds} batches.` },
}

const ML_PER_OZ = 30

// Resolves a Drink and the Options picked for its Slots into the Riff to make,
// scaled to `settings.servings` and shown in `settings.units`.
// Slots left out of `picks` use the House Spec. Throws if a pick doesn't fit
// the Drink; Retired Options are allowed, since Favorites may still use them.
export function resolveRiff(drink: Drink, picks: Picks = {}, settings: RiffSettings = {}): Riff {
  return resolve(drink, picks, settings).riff
}

// Resolves every combination of Options (Retired ones included) and reports
// steps whose placeholders name an empty Slot.
export function checkEveryRiff(drink: Drink): string[] {
  const problems: string[] = []
  for (const picks of everyCombination(drink)) {
    const { unresolved } = resolve(drink, picks)
    const label = Object.entries(picks)
      .map(([slot, option]) => `${slot}=${option ?? '(empty)'}`)
      .join(', ')
    for (const { stepId, placeholder } of unresolved) {
      problems.push(`Riff ${label}: step "${stepId}" has unresolved {${placeholder}}`)
    }
  }
  return problems
}

function resolve(drink: Drink, requested: Picks, { servings = 1, units = 'oz', glassOz }: RiffSettings = {}) {
  if (!Number.isInteger(servings) || servings < 1 || servings > MAX_SERVINGS) {
    throw new Error(`servings must be a whole number from 1 to ${MAX_SERVINGS}`)
  }
  if (glassOz !== undefined && !(glassOz >= 2 && glassOz <= 64)) {
    throw new Error('glassOz must be from 2 to 64')
  }
  const glassSize = glassOz ?? GLASS_SIZES_OZ[drink.glass]
  const glassRatio = glassSize / GLASS_SIZES_OZ[drink.glass]
  for (const slotId of Object.keys(requested)) {
    if (!drink.slots.some((slot) => slot.id === slotId)) throw new Error(`unknown Slot "${slotId}"`)
  }

  const picks: Picks = {}
  const picked = new Map<string, Option | null>()
  for (const slot of drink.slots) {
    const optionId = slot.id in requested ? requested[slot.id] : drink.houseSpec[slot.id]
    if (optionId === null) {
      if (!slot.optional) throw new Error(`Slot "${slot.id}" is not optional and cannot be empty`)
      picked.set(slot.id, null)
    } else {
      const option = slot.options.find((candidate) => candidate.id === optionId)
      if (!option) throw new Error(`Slot "${slot.id}" has no Option "${optionId}"`)
      picked.set(slot.id, option)
    }
    picks[slot.id] = optionId
  }
  const options = [...picked.values()].filter((option): option is Option => option !== null)

  const method = options.reduce<Method>((current, option) => option.method ?? current, drink.method)
  // What you pour comes first, then the ice, then the garnish, keeping the
  // Drink's order within each. A garnish is anything from the garnish Slot
  // or named "for garnish".
  const sources = [
    ...drink.ingredients.map((ingredient) => ({ ingredient, garnish: false })),
    ...drink.slots.flatMap((slot) =>
      (picked.get(slot.id)?.ingredients ?? []).map((ingredient) => ({ ingredient, garnish: slot.id === 'garnish' })),
    ),
  ]
  const place = ({ ingredient, garnish }: (typeof sources)[number]) =>
    garnish || /\bfor garnish\b/.test(ingredient.name) ? 2 : /\bice\b/.test(ingredient.name) ? 1 : 0
  const ingredients = sources
    .sort((a, b) => place(a) - place(b))
    .map(({ ingredient }) => measure(ingredient, servings, units, glassRatio))
  const batch = BATCH_LIMITS[method]
  const batchNotes = batch && servings > batch.size ? [batch.note(Math.ceil(servings / batch.size))] : []

  const unresolved: { stepId: string; placeholder: string }[] = []
  const steps = orderSteps(drink.steps, options)
    .filter((step) => isShown(step, picks))
    .map((step): RiffStep => {
      const text = step.text.replace(/\{([^}]*)\}/g, (match, slotId: string) => {
        const option = picked.get(slotId)
        if (option) return option.phrase ?? option.label
        unresolved.push({ stepId: step.id, placeholder: slotId })
        return match
      })
      const durationSeconds = options.reduce<number | undefined>(
        (current, option) => option.durations?.[step.id] ?? current,
        step.durationSeconds,
      )
      return { id: step.id, text, tools: step.tools ?? [], ...(durationSeconds ? { durationSeconds } : {}) }
    })

  const tools = [...new Set([...METHOD_TOOLS[method], ...steps.flatMap((step) => step.tools)])]
  const tags = new Set(options.flatMap((option) => option.dietaryTags ?? []))

  const riff: Riff = {
    drinkId: drink.id,
    name: drink.name,
    glass: drink.glass,
    method,
    servings,
    units,
    picks,
    slots: drink.slots.map((slot) => {
      const option = picked.get(slot.id)
      return {
        id: slot.id,
        label: slot.label,
        option: option ? { id: option.id, label: option.label, retired: option.retired ?? false } : null,
      }
    }),
    ingredients,
    steps,
    glassOz: glassSize,
    miseEnPlace: { glass: drink.glass, glassCount: servings, tools, ingredients },
    batchNotes,
    dietaryTags: DIETARY_TAGS.filter((tag) => tags.has(tag)),
    colors: options.map((option) => option.color),
    isHouseSpec: drink.slots.every((slot) => picks[slot.id] === drink.houseSpec[slot.id]),
    // Only what differs from the House Spec ("Cherry Limeade · soda water"),
    // so a list of Favorites of one Drink reads as their differences.
    defaultFavoriteName: [
      drink.name,
      drink.slots
        .filter((slot) => picks[slot.id] !== drink.houseSpec[slot.id])
        .map((slot) => picked.get(slot.id)?.label.toLowerCase() ?? `no ${slot.label.toLowerCase()}`)
        .join(', '),
    ]
      .filter(Boolean)
      .join(' · '),
  }
  return { riff, unresolved }
}

// Base steps, then each picked Option's added steps in Slot order. A step
// added after another goes after any steps already added there; one with
// no `after` goes after any steps already added at the start. Removed
// steps are dropped last, so a removed step can still anchor additions.
function orderSteps(base: Step[], options: Option[]): Step[] {
  const steps = [...base]
  const lastAddedAfter = new Map<string | undefined, string>()
  for (const option of options) {
    for (const { after, step } of option.addSteps ?? []) {
      const anchor = lastAddedAfter.get(after) ?? after
      let index = 0
      if (anchor !== undefined) {
        // An anchor added by an Option that isn't picked: put the step last.
        const at = steps.findIndex((candidate) => candidate.id === anchor)
        index = at === -1 ? steps.length : at + 1
      }
      steps.splice(index, 0, step)
      lastAddedAfter.set(after, step.id)
    }
  }
  const removed = new Set(options.flatMap((option) => option.removeSteps ?? []))
  return steps.filter((step) => !removed.has(step.id))
}

// Scales an amount by the serving count, then converts oz and ml into the
// chosen units. Poured amounts (oz and ml) also scale to the glass, and are
// then rounded to something pourable. Other measured units scale by servings
// but never convert or follow the glass; Top, to taste and fill have no
// amount and are left alone.
function measure(ingredient: Ingredient, servings: number, units: Units, glassRatio: number): Ingredient {
  if (ingredient.amount === undefined) return ingredient
  const poured = ingredient.unit === 'oz' || ingredient.unit === 'ml'
  const scaled = ingredient.amount * servings * (poured ? glassRatio : 1)
  if (ingredient.unit === 'oz' && units === 'ml') return { ...ingredient, amount: roundMl(scaled * ML_PER_OZ), unit: 'ml' }
  if (ingredient.unit === 'ml' && units === 'oz') return { ...ingredient, amount: roundOz(scaled / ML_PER_OZ), unit: 'oz' }
  if (poured && glassRatio !== 1) {
    return { ...ingredient, amount: ingredient.unit === 'oz' ? roundOz(scaled) : roundMl(scaled) }
  }
  return { ...ingredient, amount: tidy(scaled) }
}

// Nearest 5 ml above 15 ml, nearest 2.5 ml at or below, never less than 2.5 ml.
function roundMl(ml: number): number {
  const step = ml > 15 ? 5 : 2.5
  return Math.max(2.5, Math.round(ml / step) * step)
}

// Nearest quarter ounce, never less than a quarter.
function roundOz(oz: number): number {
  return Math.max(0.25, Math.round(oz * 4) / 4)
}

// Drops floating-point noise such as 0.30000000000000004.
function tidy(amount: number): number {
  return Math.round(amount * 1000) / 1000
}

function isShown(step: Step, picks: Picks): boolean {
  if (!step.when) return true
  const optionId = picks[step.when.slot]
  if (optionId === null || optionId === undefined) return false
  return step.when.option === undefined || step.when.option === optionId
}

function everyCombination(drink: Drink): Picks[] {
  return drink.slots.reduce<Picks[]>(
    (combinations, slot) => {
      const choices: (string | null)[] = slot.options.map((option) => option.id)
      if (slot.optional) choices.push(null)
      return combinations.flatMap((picks) => choices.map((choice) => ({ ...picks, [slot.id]: choice })))
    },
    [{}],
  )
}
