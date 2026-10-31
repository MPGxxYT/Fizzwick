import { checkEveryRiff, FORMAT_VERSION, MEASURED_UNITS, parseDrinkFile, type Drink, type Ingredient, type Step } from '../riff-engine'
import { nameTaken } from './copy-drink'

// A Drink being edited may be half finished: no name yet, an ingredient with
// no amount. checkDraft says what's missing, keyed by the field to show it
// beside, or gives back the Drink ready to save. Field keys: name,
// flavorTags, slots, steps, ingredients.<i>, steps.<i>, slots.<s>,
// slots.<s>.options.<o>, slots.<s>.options.<o>.ingredients.<i>, and drink
// for anything that belongs to no one field.
export type FieldErrors = Record<string, string>

export function blankDrink(randomId: string): Drink {
  return {
    formatVersion: FORMAT_VERSION,
    id: `my-${randomId}`,
    name: '',
    glass: 'collins',
    method: 'build',
    flavorTags: [],
    ingredients: [],
    slots: [],
    steps: [],
    houseSpec: {},
  }
}

const finishIngredient = ({ name, amount, unit, countsAs }: Ingredient): Ingredient => ({
  name: name.trim(),
  ...(measured(unit) ? { amount } : {}),
  unit,
  ...(countsAs ? { countsAs } : {}),
})
const measured = (unit: string) => (MEASURED_UNITS as readonly string[]).includes(unit)
const placeholders = (text: string) => [...text.matchAll(/\{([^}]*)\}/g)].map(([, name]) => name)

// Every step, including the ones Options add.
const allSteps = (drink: Drink): Step[] => [
  ...drink.steps,
  ...drink.slots.flatMap((slot) => slot.options.flatMap((option) => (option.addSteps ?? []).map((added) => added.step))),
]

export function checkDraft(draft: Drink, otherNames: string[]): { drink?: Drink; errors: FieldErrors } {
  const errors: FieldErrors = {}
  const name = draft.name.trim()
  if (!name) errors.name = 'Give the drink a name.'
  else if (nameTaken(name, otherNames)) errors.name = 'You already have a drink called that.'
  if (draft.flavorTags.length === 0) errors.flavorTags = 'Pick at least one Flavor Tag.'
  if (draft.slots.length === 0) errors.slots = 'Add at least one Slot with an Option.'
  if (draft.steps.length === 0) errors.steps = 'Add at least one step.'

  const checkIngredients = (ingredients: Ingredient[], key: string) =>
    ingredients.forEach((ingredient, i) => {
      if (!ingredient.name.trim()) errors[`${key}.${i}`] = 'Name the ingredient.'
      else if (measured(ingredient.unit) && !(ingredient.amount! > 0)) errors[`${key}.${i}`] = 'Add an amount.'
    })
  checkIngredients(draft.ingredients, 'ingredients')

  draft.slots.forEach((slot, s) => {
    if (!slot.label.trim()) errors[`slots.${s}`] = 'Name the Slot.'
    else if (slot.options.every((option) => option.retired)) errors[`slots.${s}`] = 'Add an Option to this Slot.'
    else if (draft.houseSpec[slot.id] == null && !slot.optional) {
      errors[`slots.${s}`] = 'Pick the House Spec Option, or make the Slot optional.'
    }
    slot.options.forEach((option, o) => {
      if (!option.retired && !option.label.trim()) errors[`slots.${s}.options.${o}`] = 'Name the Option.'
      checkIngredients(option.ingredients, `slots.${s}.options.${o}.ingredients`)
    })
  })

  const slotIds = draft.slots.map((slot) => slot.id)
  draft.steps.forEach((step, i) => {
    const unknown = placeholders(step.text).find((slot) => !slotIds.includes(slot))
    if (!step.text.trim()) errors[`steps.${i}`] = 'Write the step.'
    else if (unknown !== undefined) {
      errors[`steps.${i}`] =
        slotIds.length > 0
          ? `There is no Slot called {${unknown}}. Slots: ${slotIds.map((id) => `{${id}}`).join(', ')}.`
          : `There is no Slot called {${unknown}}. This drink has no Slots yet.`
    } else if (step.durationSeconds !== undefined && !(Number.isInteger(step.durationSeconds) && step.durationSeconds > 0)) {
      errors[`steps.${i}`] = 'Set a time above zero, or remove the timer.'
    }
  })
  if (Object.keys(errors).length > 0) return { errors }

  // A step naming an optional Slot shows only when that Slot is filled, so
  // its placeholder always has something to say. Copied steps keep theirs.
  const optional = new Set(draft.slots.filter((slot) => slot.optional).map((slot) => slot.id))
  const finished: Drink = {
    ...draft,
    name,
    ingredients: draft.ingredients.map(finishIngredient),
    slots: draft.slots.map((slot) => ({
      ...slot,
      label: slot.label.trim(),
      options: slot.options.map(({ phrase, ...option }) => ({
        ...option,
        label: option.label.trim(),
        ...(phrase?.trim() ? { phrase: phrase.trim() } : {}),
        ingredients: option.ingredients.map(finishIngredient),
      })),
    })),
    steps: draft.steps.map((step) => {
      const text = step.text.trim()
      const emptyable = placeholders(text).find((slot) => optional.has(slot))
      return step.when || emptyable === undefined ? { ...step, text } : { ...step, text, when: { slot: emptyable } }
    }),
  }

  const parsed = parseDrinkFile(finished)
  if (!parsed.ok) return { errors: { drink: parsed.errors.join('\n') } }
  for (const problem of checkEveryRiff(parsed.drink)) {
    const [, stepId, slot] = problem.match(/step "([^"]+)" has unresolved \{([^}]+)\}/) ?? []
    const i = draft.steps.findIndex((step) => step.id === stepId)
    if (i >= 0) errors[`steps.${i}`] = `This step names {${slot}}, which can be left empty.`
    else errors.drink = problem
  }
  return Object.keys(errors).length > 0 ? { errors } : { drink: parsed.drink, errors }
}

// A step an Option removes, times or adds steps after can't be removed, or
// that Option would break.
export function stepInUse(drink: Drink, stepId: string): boolean {
  return drink.slots.some((slot) =>
    slot.options.some(
      (option) =>
        option.removeSteps?.includes(stepId) ||
        option.addSteps?.some((added) => added.after === stepId) ||
        (option.durations && stepId in option.durations),
    ),
  )
}

export function newStepId(drink: Drink): string {
  const taken = new Set(allSteps(drink).map((step) => step.id))
  let n = 1
  while (taken.has(`step-${n}`)) n++
  return `step-${n}`
}
