import type { Favorite } from '../favorites/favorite'
import type { Drink, Option, Slot } from '../riff-engine'
import { colorFor } from './suggest'

// Changes the editor makes to a Drink's Slots and Options. Slot and Option
// IDs come from their labels when they're made and never change after, since
// Favorites and Riff links refer to them (ADR 0001).

// Colors a new Option starts with, in turn, when its name has no color of
// its own (colorFor).
const START_COLORS = ['#7fe3c6', '#ff8fb0', '#f5c26b', '#9db4ff', '#c99bff', '#8fd18a', '#ff9e6d', '#e7f5c4']

export function idFromLabel(label: string, taken: string[], fallback: string): string {
  const base =
    label
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || fallback
  let id = base
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`
  return id
}

const withSlot = (drink: Drink, slotId: string, change: (slot: Slot) => Slot): Drink => ({
  ...drink,
  slots: drink.slots.map((slot) => (slot.id === slotId ? change(slot) : slot)),
})

function newOption(slot: Slot | undefined, label: string): Option {
  const options = slot?.options ?? []
  return {
    id: idFromLabel(label, options.map((option) => option.id), 'option'),
    label,
    ingredients: [],
    color: colorFor(label) ?? START_COLORS[options.length % START_COLORS.length],
  }
}

// A new Slot comes with one Option, which becomes its House Spec.
export function addSlot(drink: Drink, label: string): Drink {
  const id = idFromLabel(label, drink.slots.map((slot) => slot.id), 'slot')
  const option = newOption(undefined, label)
  return {
    ...drink,
    slots: [...drink.slots, { id, label, options: [option] }],
    houseSpec: { ...drink.houseSpec, [id]: option.id },
  }
}

export function addOption(drink: Drink, slotId: string, label: string): Drink {
  return withSlot(drink, slotId, (slot) => ({ ...slot, options: [...slot.options, newOption(slot, label)] }))
}

export function setOptionLabel(drink: Drink, slotId: string, optionId: string, label: string): Drink {
  return withSlot(drink, slotId, (slot) => ({
    ...slot,
    options: slot.options.map((option) => (option.id === optionId ? { ...option, label } : option)),
  }))
}

// An Option a Favorite of this Drink picks, or a step shows only for, is
// retired instead, so that Favorite still opens with it. If it was the House
// Spec, the first Option left takes over.
export function removeOption(drink: Drink, slotId: string, optionId: string, favorites: Favorite[]): Drink {
  const inUse =
    favorites.some((favorite) => favorite.drinkId === drink.id && favorite.picks[slotId] === optionId) ||
    drink.steps.some((step) => step.when?.slot === slotId && step.when.option === optionId)
  const next = withSlot(drink, slotId, (slot) => ({
    ...slot,
    options: inUse
      ? slot.options.map((option) => (option.id === optionId ? { ...option, retired: true } : option))
      : slot.options.filter((option) => option.id !== optionId),
  }))
  if (drink.houseSpec[slotId] !== optionId) return next
  const first = next.slots.find((slot) => slot.id === slotId)?.options.find((option) => !option.retired)
  return { ...next, houseSpec: { ...next.houseSpec, [slotId]: first?.id ?? null } }
}

// Steps that only showed for this Slot lose that condition; a step that
// still names the Slot in braces then shows an error to fix.
export function removeSlot(drink: Drink, slotId: string): Drink {
  const { [slotId]: _removed, ...houseSpec } = drink.houseSpec
  return {
    ...drink,
    slots: drink.slots.filter((slot) => slot.id !== slotId),
    houseSpec,
    steps: drink.steps.map(({ when, ...step }) => (when && when.slot !== slotId ? { ...step, when } : step)),
  }
}

// How many Favorites of this Drink have an Option picked in the Slot, and
// so will open without it once the Slot is gone.
export function favoritesPickingFrom(drinkId: string, slotId: string, favorites: Favorite[]): number {
  return favorites.filter((favorite) => favorite.drinkId === drinkId && favorite.picks[slotId] != null).length
}
