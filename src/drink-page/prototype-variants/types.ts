// PROTOTYPE: throwaway. Props every Drink page look variant receives.
import type { Drink, Glass, Ingredient, Picks, Riff } from '../../riff-engine'

export interface VariantProps {
  drink: Drink
  riff: Riff
  pick: (slotId: string, optionId: string | null) => void
  reset: () => void
  servings: number
  setServings: (servings: number) => void
}

export type { Picks }

// The Riff engine lists fixed ingredients first, then each Slot's in order.
// Splits them back up so a variant can show a Slot next to its ingredients.
export function ingredientsBySlot(drink: Drink, riff: Riff): { fixed: Ingredient[]; slots: Record<string, Ingredient[]> } {
  let at = drink.ingredients.length
  const slots: Record<string, Ingredient[]> = {}
  for (const slot of drink.slots) {
    const option = slot.options.find((candidate) => candidate.id === riff.picks[slot.id])
    const count = option?.ingredients.length ?? 0
    slots[slot.id] = riff.ingredients.slice(at, at + count)
    at += count
  }
  return { fixed: riff.ingredients.slice(0, drink.ingredients.length), slots }
}

// "Collins glass" stays capitalized; "Rocks glass" becomes "rocks glass".
export function glassInSentence(name: string): string {
  return name.startsWith('Collins') ? name : name.toLowerCase()
}

// Adds a Google Fonts stylesheet once.
export function loadFont(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.append(link)
}

// Typical sizes. If this survives the prototype, it belongs in the Drink data.
export const GLASS_SIZES_OZ: Record<Glass, number> = {
  collins: 12,
  highball: 10,
  rocks: 8,
  coupe: 6,
  mug: 16,
  hurricane: 15,
}
