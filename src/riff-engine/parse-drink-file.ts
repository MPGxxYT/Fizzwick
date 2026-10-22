import { drinkSchema, MEASURED_UNITS, type Drink, type Ingredient } from './drink-format'

export type ParseResult = { ok: true; drink: Drink } | { ok: false; errors: string[] }

// Checks a Drink file's shape, then the references between its parts.
// Returns every problem found, each as "<where>: <what>".
export function parseDrinkFile(input: unknown): ParseResult {
  const shape = drinkSchema.safeParse(input)
  if (!shape.success) {
    return { ok: false, errors: shape.error.issues.map((issue) => `${formatPath(issue.path)}: ${issue.message}`) }
  }
  const errors = checkReferences(shape.data)
  return errors.length === 0 ? { ok: true, drink: shape.data } : { ok: false, errors }
}

function formatPath(path: readonly PropertyKey[]): string {
  if (path.length === 0) return '(root)'
  return path.map((part, i) => (typeof part === 'number' ? `[${part}]` : i === 0 ? String(part) : `.${String(part)}`)).join('')
}

function checkReferences(drink: Drink): string[] {
  const errors: string[] = []

  for (const id of duplicates(drink.slots.map((slot) => slot.id))) {
    errors.push(`slots: duplicate Slot ID "${id}"`)
  }
  for (const slot of drink.slots) {
    for (const id of duplicates(slot.options.map((option) => option.id))) {
      errors.push(`Slot "${slot.id}": duplicate Option ID "${id}"`)
    }
    if (slot.options.every((option) => option.retired)) {
      errors.push(`Slot "${slot.id}": every Option is retired`)
    }
  }

  const addedSteps = drink.slots.flatMap((slot) => slot.options.flatMap((option) => option.addSteps ?? []))
  const allSteps = [...drink.steps, ...addedSteps.map((added) => added.step)]
  const stepIds = new Set(allSteps.map((step) => step.id))
  for (const id of duplicates(allSteps.map((step) => step.id))) {
    errors.push(`steps: duplicate step ID "${id}"`)
  }

  const slotsById = new Map(drink.slots.map((slot) => [slot.id, slot]))
  for (const step of allSteps) {
    for (const [, name] of step.text.matchAll(/\{([^}]*)\}/g)) {
      if (!slotsById.has(name)) errors.push(`step "${step.id}": placeholder {${name}} names an unknown Slot`)
    }
    if (step.when) {
      const slot = slotsById.get(step.when.slot)
      if (!slot) {
        errors.push(`step "${step.id}": when names unknown Slot "${step.when.slot}"`)
      } else if (step.when.option && !slot.options.some((option) => option.id === step.when?.option)) {
        errors.push(`step "${step.id}": when names unknown Option "${step.when.option}" in Slot "${slot.id}"`)
      }
    }
  }

  drink.ingredients.forEach((ingredient, i) => checkAmount(ingredient, `ingredients[${i}]`, errors))
  drink.slots.forEach((slot, s) =>
    slot.options.forEach((option, o) => {
      const where = `Option "${option.id}" in Slot "${slot.id}"`
      option.ingredients.forEach((ingredient, i) =>
        checkAmount(ingredient, `slots[${s}].options[${o}].ingredients[${i}]`, errors),
      )
      for (const added of option.addSteps ?? []) {
        if (added.after && !stepIds.has(added.after)) errors.push(`${where}: addSteps after unknown step "${added.after}"`)
      }
      for (const id of option.removeSteps ?? []) {
        if (!stepIds.has(id)) errors.push(`${where}: removeSteps names unknown step "${id}"`)
      }
      for (const id of Object.keys(option.durations ?? {})) {
        if (!stepIds.has(id)) errors.push(`${where}: durations names unknown step "${id}"`)
      }
    }),
  )

  for (const slotId of Object.keys(drink.houseSpec)) {
    if (!slotsById.has(slotId)) errors.push(`houseSpec: unknown Slot "${slotId}"`)
  }
  for (const slot of drink.slots) {
    if (!(slot.id in drink.houseSpec)) {
      errors.push(`houseSpec: missing Slot "${slot.id}" (use null to leave an optional Slot empty)`)
      continue
    }
    const optionId = drink.houseSpec[slot.id]
    if (optionId === null) {
      if (!slot.optional) errors.push(`houseSpec: Slot "${slot.id}" is not optional and cannot be empty`)
      continue
    }
    const option = slot.options.find((candidate) => candidate.id === optionId)
    if (!option) errors.push(`houseSpec: Slot "${slot.id}" has no Option "${optionId}"`)
    else if (option.retired) errors.push(`houseSpec: Option "${optionId}" in Slot "${slot.id}" is retired`)
  }

  return errors
}

function checkAmount(ingredient: Ingredient, where: string, errors: string[]) {
  const measured = (MEASURED_UNITS as readonly string[]).includes(ingredient.unit)
  if (measured && ingredient.amount === undefined) errors.push(`${where}: "${ingredient.unit}" needs a positive amount`)
  if (!measured && ingredient.amount !== undefined) errors.push(`${where}: "${ingredient.unit}" has no amount`)
}

function duplicates(ids: string[]): string[] {
  const seen = new Set<string>()
  const repeated = new Set<string>()
  for (const id of ids) (seen.has(id) ? repeated : seen).add(id)
  return [...repeated]
}
