import { resolveRiff, type Drink, type Picks } from '../riff-engine'

// Custom Drink IDs start with this, and House Drink IDs never do (a House
// Drink test checks), so the two can't clash. The rest is random, so a
// rename never changes the ID that Favorites and Riff links use.
const CUSTOM_ID_PREFIX = 'my-'

export function isCustomDrinkId(id: string): boolean {
  return id.startsWith(CUSTOM_ID_PREFIX)
}

const key = (name: string) => name.trim().toLowerCase()

// Drink names are unique across House and Custom Drinks, ignoring case and
// spaces at the ends.
export function nameTaken(name: string, names: string[]): boolean {
  return names.some((other) => key(other) === key(name))
}

// A new Custom Drink from the Riff being viewed. It keeps every Slot, Option
// and step with their IDs, and the Riff becomes its House Spec. It's named
// like a Favorite of that Riff ("Citrus Spritz · soda water"), with "(copy)"
// or "(copy 2)" added when the name is taken. No photo: the House Drink's
// shows its own House Spec, so the copy draws its glass instead.
export function copyDrink(drink: Drink, picks: Picks, takenNames: string[], randomId: string): Drink {
  const riff = resolveRiff(drink, picks)
  const base = riff.defaultFavoriteName
  let name = base
  for (let n = 1; nameTaken(name, takenNames); n++) name = `${base} (copy${n > 1 ? ` ${n}` : ''})`

  const { photo: _photo, ...rest } = drink
  return { ...rest, id: `${CUSTOM_ID_PREFIX}${randomId}`, name, houseSpec: riff.picks }
}
