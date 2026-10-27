import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { run } from '../db'
import { houseDrinks } from '../house-drinks/catalog'
import { parseDrinkFile, type Drink } from '../riff-engine'

// Custom Drinks in IndexedDB on this device, stored as Drink files (ADR 0001).
// Like Favorites, the list is loaded once and kept in memory, and every
// change writes through and then updates the list.
export type CustomDrinksState =
  | { status: 'loading' }
  | { status: 'ready'; drinks: Drink[] }
  | { status: 'unavailable' } // IndexedDB blocked or broken

let state: CustomDrinksState = { status: 'loading' }
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

function set(next: CustomDrinksState) {
  state = next
  for (const listener of listeners) listener()
}

// A stored Drink that no longer parses is left out rather than breaking the
// list. The editor only saves Drinks that parse, so this shouldn't happen.
function load(): Promise<void> {
  return (loading ??= run<unknown[]>('drinks', 'readonly', (store) => store.getAll()).then(
    (stored) =>
      set({
        status: 'ready',
        drinks: stored.flatMap((contents) => {
          const result = parseDrinkFile(contents)
          return result.ok ? [result.drink] : []
        }),
      }),
    () => set({ status: 'unavailable' }),
  ))
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useCustomDrinks(): CustomDrinksState {
  useEffect(() => void load(), [])
  return useSyncExternalStore(subscribe, () => state)
}

// Adds or replaces a Custom Drink. Rejects if the device won't store it.
export async function putCustomDrink(drink: Drink): Promise<void> {
  await load()
  await run('drinks', 'readwrite', (store) => store.put(drink))
  const others = state.status === 'ready' ? state.drinks.filter((other) => other.id !== drink.id) : []
  set({ status: 'ready', drinks: [...others, drink] })
}

// Eight lowercase letters and digits, for the random part of a Custom Drink ID.
export function shortId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (byte) => '0123456789abcdefghijklmnopqrstuvwxyz'[byte % 36]).join('')
}

export type DrinksState = { status: 'loading' | 'ready'; drinks: Drink[] }

const byName = (a: Drink, b: Drink) => a.name.localeCompare(b.name)

// Every Drink, House and Custom, by name. While Custom Drinks load (or when
// the device won't store them) the House Drinks show on their own.
export function useDrinks(): DrinksState {
  const custom = useCustomDrinks()
  return useMemo(
    () =>
      custom.status === 'ready'
        ? { status: 'ready', drinks: [...houseDrinks, ...custom.drinks].sort(byName) }
        : { status: custom.status === 'loading' ? 'loading' : 'ready', drinks: houseDrinks },
    [custom],
  )
}
