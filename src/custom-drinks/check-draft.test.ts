import { describe, expect, test } from 'vitest'
import cherryLimeadeFile from '../house-drinks/cherry-limeade.json'
import { parseDrinkFile, resolveRiff, type Drink } from '../riff-engine'
import { blankDrink, checkDraft, newStepId, stepInUse } from './check-draft'
import { copyDrink } from './copy-drink'

function parse(input: unknown): Drink {
  const result = parseDrinkFile(input)
  if (!result.ok) throw new Error(result.errors.join('\n'))
  return result.drink
}

const cherryLimeade = parse(cherryLimeadeFile)
const copy = copyDrink(cherryLimeade, cherryLimeade.houseSpec, ['Cherry Limeade'], 'abc')

describe('checkDraft', () => {
  test('a copy saves as it is', () => {
    const result = checkDraft(copy, ['Cherry Limeade'])
    expect(result.errors).toEqual({})
    expect(result.drink).toEqual(copy)
  })

  test('a blank Drink needs a name, a Flavor Tag, a Slot and a step', () => {
    const { errors, drink } = checkDraft(blankDrink('abc'), [])
    expect(drink).toBeUndefined()
    expect(errors).toEqual({
      name: 'Give the drink a name.',
      flavorTags: 'Pick at least one Flavor Tag.',
      slots: 'Add at least one Slot with an Option.',
      steps: 'Add at least one step.',
    })
  })

  test('the name must differ from every other Drink, ignoring case and spaces', () => {
    expect(checkDraft({ ...copy, name: ' cherry limeade ' }, ['Cherry Limeade']).errors).toEqual({
      name: 'You already have a drink called that.',
    })
  })

  test('saving trims the name', () => {
    expect(checkDraft({ ...copy, name: '  Lime Fizz ' }, []).drink?.name).toBe('Lime Fizz')
  })

  test('each ingredient needs a name, and a measured one a positive amount', () => {
    const ingredients = [
      { name: '', amount: 1, unit: 'oz' as const },
      { name: 'lime juice', unit: 'oz' as const },
      { name: 'soda', amount: 0, unit: 'oz' as const },
      { name: 'soda water', unit: 'top' as const },
    ]
    expect(checkDraft({ ...copy, ingredients }, []).errors).toEqual({
      'ingredients.0': 'Name the ingredient.',
      'ingredients.1': 'Add an amount.',
      'ingredients.2': 'Add an amount.',
    })
  })

  test('an unmeasured ingredient drops any amount left over from a unit change', () => {
    const ingredients = [{ name: 'soda water', amount: 2, unit: 'top' as const }]
    expect(checkDraft({ ...copy, ingredients }, []).drink?.ingredients).toEqual([{ name: 'soda water', unit: 'top' }])
  })

  test('a step needs words, and may only name Slots the Drink has', () => {
    const steps = [{ id: 'a', text: '  ' }, { id: 'b', text: 'Add the {fruit}.' }, ...copy.steps]
    expect(checkDraft({ ...copy, steps }, []).errors).toEqual({
      'steps.0': 'Write the step.',
      'steps.1': 'There is no Slot called {fruit}. Slots: {cherry}, {sweetener}, {fizz}, {garnish}.',
    })
  })

  test('a new step naming an optional Slot only shows when that Slot is filled', () => {
    const steps = [...copy.steps, { id: 'step-1', text: 'Taste, and add more {sweetener} if you like.' }]
    const result = checkDraft({ ...copy, steps }, [])
    expect(result.errors).toEqual({})
    expect(result.drink?.steps.at(-1)?.when).toEqual({ slot: 'sweetener' })
    expect(resolveRiff(result.drink!).steps.map((step) => step.id)).not.toContain('step-1')
  })

  test('a step timer must be a whole number of seconds above zero', () => {
    const steps = [{ ...copy.steps[0], durationSeconds: 0 }, ...copy.steps.slice(1)]
    expect(checkDraft({ ...copy, steps }, []).errors).toEqual({ 'steps.0': 'Set a time above zero, or remove the timer.' })
  })
})

describe('checkDraft on Slots and Options', () => {
  const withSlot = (change: (slot: Drink['slots'][number]) => Drink['slots'][number]) => ({
    ...copy,
    slots: copy.slots.map((slot) => (slot.id === 'fizz' ? change(slot) : slot)),
  })

  test('each Slot and Option needs a name', () => {
    const draft = withSlot((slot) => ({
      ...slot,
      label: ' ',
      options: slot.options.map((option, i) => (i === 1 ? { ...option, label: '' } : option)),
    }))
    expect(checkDraft(draft, []).errors).toEqual({
      'slots.2': 'Name the Slot.',
      'slots.2.options.1': 'Name the Option.',
    })
  })

  test("an Option's ingredients are checked like the fixed ones", () => {
    const draft = withSlot((slot) => ({
      ...slot,
      options: slot.options.map((option, i) => (i === 0 ? { ...option, ingredients: [{ name: 'soda', unit: 'oz' as const }] } : option)),
    }))
    expect(checkDraft(draft, []).errors).toEqual({ 'slots.2.options.0.ingredients.0': 'Add an amount.' })
  })

  test('a Slot needs an Option that can still be picked', () => {
    const draft = withSlot((slot) => ({ ...slot, options: slot.options.map((option) => ({ ...option, retired: true })) }))
    expect(checkDraft(draft, []).errors).toEqual({ 'slots.2': 'Add an Option to this Slot.' })
  })

  test('a Slot that must be filled needs a House Spec Option', () => {
    expect(checkDraft({ ...copy, houseSpec: { ...copy.houseSpec, fizz: null } }, []).errors).toEqual({
      'slots.2': 'Pick the House Spec Option, or make the Slot optional.',
    })
  })

  test('Option labels and phrases are trimmed on save, and an empty phrase is dropped', () => {
    const draft = withSlot((slot) => ({
      ...slot,
      options: slot.options.map((option, i) => (i === 0 ? { ...option, label: ' Lemon-lime soda ', phrase: '  ' } : option)),
    }))
    const option = checkDraft(draft, []).drink?.slots[2].options[0]
    expect(option?.label).toBe('Lemon-lime soda')
    expect(option && 'phrase' in option).toBe(false)
  })
})

describe('stepInUse', () => {
  test('a step an Option removes or adds after is in use', () => {
    expect(stepInUse(copy, 'add-base')).toBe(true) // muddled cherries remove it
    expect(stepInUse(copy, 'fill-glass')).toBe(true) // the strain step goes after it
    expect(stepInUse(copy, 'top')).toBe(false)
  })
})

describe('newStepId', () => {
  test('is free among every step, including steps Options add', () => {
    expect(newStepId(copy)).toBe('step-1')
    expect(newStepId({ ...copy, steps: [...copy.steps, { id: 'step-1', text: 'x' }] })).toBe('step-2')
  })
})
