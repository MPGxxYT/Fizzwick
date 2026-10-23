import type { Drink } from './drink-format'
import type { Picks } from './resolve-riff'

// A Riff link is the Drink's path plus the Slots that differ from the House
// Spec, as slot=option pairs: /drinks/cherry-limeade/cherry=muddled-cherries,fizz=soda-water
// IDs only, so the link works offline against whatever Drink file the app has.
// A dash marks an empty optional Slot. Option IDs never start with a dash.
const EMPTY = '-'

export function riffLink(drink: Drink, picks: Picks): string {
  const pairs = drink.slots
    .filter((slot) => slot.id in picks && picks[slot.id] !== drink.houseSpec[slot.id])
    .map((slot) => `${slot.id}=${picks[slot.id] ?? EMPTY}`)
  return `/drinks/${drink.id}${pairs.length > 0 ? `/${pairs.join(',')}` : ''}`
}

// The picks a link's pairs ask for. A pick the Drink can't make (an Option it
// doesn't know, or an empty Slot that must be filled) falls back to the House
// Spec, and its Slot is listed in fellBack so the page can say so. Retired
// Options open as they are. Slots the Drink doesn't have are ignored.
export function readRiffLink(drink: Drink, pairs: string | undefined): { picks: Picks; fellBack: string[] } {
  const asked = new Map<string, string>()
  for (const pair of (pairs ?? '').split(',')) {
    const [slotId, optionId, ...rest] = pair.split('=')
    if (slotId && optionId && rest.length === 0) asked.set(slotId, optionId)
  }

  const picks: Picks = { ...drink.houseSpec }
  const fellBack: string[] = []
  for (const slot of drink.slots) {
    const optionId = asked.get(slot.id)
    if (optionId === undefined) continue
    if (optionId === EMPTY ? slot.optional : slot.options.some((option) => option.id === optionId)) {
      picks[slot.id] = optionId === EMPTY ? null : optionId
    } else {
      fellBack.push(slot.id)
    }
  }
  return { picks, fellBack }
}
