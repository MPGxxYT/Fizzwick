import { useNavigate } from 'react-router'
import { isCustomDrinkId } from '../custom-drinks/copy-drink'
import { useDrinks } from '../custom-drinks/store'
import { searchDrinks, surprisePick, type FoundDrink } from '../house-drinks/search'
import type { MyBar } from '../my-bar/my-bar'
import { useCanMakeBar } from '../my-bar/use-my-bar'
import { FLAVOR_TAGS, METHODS, riffLink, TOOLS, type Drink, type FlavorTag, type Method, type Tool } from '../riff-engine'

const isMethod = (value: string | null): value is Method => (METHODS as readonly string[]).includes(value ?? '')
const isFlavor = (value: string | null): value is FlavorTag => (FLAVOR_TAGS as readonly string[]).includes(value ?? '')
const isTool = (value: string): value is Tool => (TOOLS as readonly string[]).includes(value)

export interface ListFilters {
  yours: boolean
  query: string
  method?: Method
  flavor?: FlavorTag
  tools: Tool[]
  ingredients: string[]
}

// The list's search and filters, from its address.
export function readListFilters(params: URLSearchParams): ListFilters {
  const method = params.get('method')
  const flavor = params.get('flavor')
  return {
    yours: params.get('yours') === '1',
    query: params.get('q') ?? '',
    method: isMethod(method) ? method : undefined,
    flavor: isFlavor(flavor) ? flavor : undefined,
    tools: params.getAll('tool').filter(isTool),
    ingredients: params.getAll('ing'),
  }
}

// The Drinks the list shows for those filters, and Can make's My Bar if it's on.
export function findInList(drinks: Drink[], filters: ListFilters, myBar: MyBar | undefined): FoundDrink[] {
  const { yours, tools, ...search } = filters
  return searchDrinks(yours ? drinks.filter((drink) => isCustomDrinkId(drink.id)) : drinks, {
    ...search,
    tools: tools.length > 0 ? tools : undefined,
    myBar,
  })
}

// The Drink "Surprise me" last opened, so it doesn't come up twice in a row,
// even after going back to the list in between.
let lastSurprise: string | undefined

// Opens a random Riff from the list those search params show. The Drink page
// replaces itself, so Back still goes to the list.
export function useSurprise(listSearch: string) {
  const navigate = useNavigate()
  const { drinks } = useDrinks()
  const myBar = useCanMakeBar()
  return ({ replace = false } = {}) => {
    const found = findInList(drinks, readListFilters(new URLSearchParams(listSearch)), myBar)
    const pick = surprisePick(found, lastSurprise)
    if (!pick) return
    lastSurprise = pick.drink.id
    navigate(riffLink(pick.drink, pick.picks), { replace, state: { listSearch, surprise: true } })
  }
}
