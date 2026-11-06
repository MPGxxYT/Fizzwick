import { isCustomDrinkId } from '../custom-drinks/copy-drink'
import { SHELVES, type Drink, type Shelf } from '../riff-engine'

export const SHELF_NAMES: Record<Shelf, string> = {
  'fizzy-fruity': 'Fizzy & fruity',
  'crisp-bitter': 'Crisp & bitter',
  smashes: 'Smashes',
  'iced-tea-coolers': 'Iced tea & coolers',
  'sours-sippers': 'Sours & sippers',
  'creamy-frozen': 'Creamy & frozen',
  'warm-savory': 'Warm & savory',
}

// Custom Drinks sit on their own Shelf, ahead of the House Drinks' ones. A
// House Drink without a Shelf goes last, on Everything else.
export type ListShelf = Shelf | 'yours' | 'other'
const ORDER: ListShelf[] = ['yours', ...SHELVES, 'other']
const LIST_SHELF_NAMES: Record<ListShelf, string> = { yours: 'Yours', ...SHELF_NAMES, other: 'Everything else' }

const shelfOf = (drink: Drink): ListShelf => (isCustomDrinkId(drink.id) ? 'yours' : (drink.shelf ?? 'other'))

// The items grouped by their Drink's Shelf, in Shelf order, keeping their
// order within each Shelf and leaving out empty Shelves.
export function groupByShelf<T>(items: T[], drinkOf: (item: T) => Drink) {
  return ORDER.map((shelf) => ({
    shelf,
    name: LIST_SHELF_NAMES[shelf],
    items: items.filter((item) => shelfOf(drinkOf(item)) === shelf),
  })).filter((group) => group.items.length > 0)
}

// How long the latest batch keeps its New mark.
const NEW_FOR_DAYS = 30

// The House Drinks marked New: the ones added on the latest added date, while
// that date is less than NEW_FOR_DAYS before today. The next batch takes the
// mark over.
export function newDrinkIds(drinks: Drink[], today: Date = new Date()): Set<string> {
  const dates = drinks.flatMap((drink) => (drink.added && !isCustomDrinkId(drink.id) ? [drink.added] : []))
  if (dates.length === 0) return new Set()
  const latest = dates.reduce((a, b) => (a > b ? a : b))
  const age = (today.getTime() - new Date(`${latest}T00:00:00`).getTime()) / 86_400_000
  if (age >= NEW_FOR_DAYS) return new Set()
  return new Set(drinks.filter((drink) => drink.added === latest && !isCustomDrinkId(drink.id)).map((drink) => drink.id))
}
