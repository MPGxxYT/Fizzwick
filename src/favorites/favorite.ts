import { FORMAT_VERSION, type Drink, type Picks, type Riff } from '../riff-engine'

// A saved Riff. It holds IDs only, so it always opens against the current
// Drink file: an app update changes what a Favorite makes, never breaks it.
export interface Favorite {
  id: string
  drinkId: string
  picks: Picks
  name: string
  note: string
  createdAt: number
  updatedAt: number
  formatVersion: number // the Drink format version it was saved with
}

export function newFavorite(riff: Riff, id: string, now: number): Favorite {
  return {
    id,
    drinkId: riff.drinkId,
    picks: riff.picks,
    name: riff.defaultFavoriteName,
    note: '',
    createdAt: now,
    updatedAt: now,
    formatVersion: FORMAT_VERSION,
  }
}

// The picks to open a Favorite with. Retired Options stay, since the Riff marks
// them. A pick the Drink doesn't have (or an empty Slot that must be filled)
// falls back to the House Spec for that Slot, so the Favorite still opens.
export function favoritePicks(drink: Drink, saved: Picks): Picks {
  const picks: Picks = {}
  for (const slot of drink.slots) {
    const optionId = saved[slot.id]
    const fits =
      optionId === null ? slot.optional === true : slot.options.some((option) => option.id === optionId)
    picks[slot.id] = slot.id in saved && fits ? optionId : drink.houseSpec[slot.id]
  }
  return picks
}

export function sameRiff(a: Picks, b: Picks): boolean {
  const slots = Object.keys(a)
  return slots.length === Object.keys(b).length && slots.every((slot) => slot in b && a[slot] === b[slot])
}
