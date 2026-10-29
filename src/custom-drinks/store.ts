import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { run } from '../db'
import { houseDrinks } from '../house-drinks/catalog'
import { parseDrinkFile, type Drink } from '../riff-engine'

// Custom Drinks in IndexedDB on this device, stored as Drink files (ADR 0001),
// with their photos in a store of their own, keyed by Drink ID. Like
// Favorites, the list is loaded once and kept in memory, and every change
// writes through and then updates the list. Photos are kept as object URLs
// the cards can show.
export type CustomDrinksState =
  | { status: 'loading' }
  | { status: 'ready'; drinks: Drink[]; photos: Photos }
  | { status: 'unavailable' } // IndexedDB blocked or broken

export type Photos = Record<string, string>
interface StoredPhoto {
  id: string
  blob: Blob
}

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
  return (loading ??= Promise.all([
    run<unknown[]>('drinks', 'readonly', (store) => store.getAll()),
    run<StoredPhoto[]>('photos', 'readonly', (store) => store.getAll()),
  ]).then(
    ([stored, photos]) =>
      set({
        status: 'ready',
        drinks: stored.flatMap((contents) => {
          const result = parseDrinkFile(contents)
          return result.ok ? [result.drink] : []
        }),
        photos: Object.fromEntries(photos.map(({ id, blob }) => [id, URL.createObjectURL(blob)])),
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
  const ready = readyState()
  set({ ...ready, drinks: [...ready.drinks.filter((other) => other.id !== drink.id), drink] })
}

// Sets a Custom Drink's photo, or removes it with null.
export async function putCustomPhoto(id: string, blob: Blob | null): Promise<void> {
  await load()
  if (blob) await run('photos', 'readwrite', (store) => store.put({ id, blob } satisfies StoredPhoto))
  else await run('photos', 'readwrite', (store) => store.delete(id))
  const { [id]: old, ...photos } = readyState().photos
  if (old) URL.revokeObjectURL(old)
  set({ ...readyState(), photos: blob ? { ...photos, [id]: URL.createObjectURL(blob) } : photos })
}

// The stored photos themselves, by Drink ID, for the backup.
export async function customPhotoBlobs(): Promise<Record<string, Blob>> {
  const photos = await run<StoredPhoto[]>('photos', 'readonly', (store) => store.getAll())
  return Object.fromEntries(photos.map(({ id, blob }) => [id, blob]))
}

const readyState = () => (state.status === 'ready' ? state : { status: 'ready' as const, drinks: [], photos: {} })

export async function deleteCustomDrink(id: string): Promise<void> {
  await load()
  await run('drinks', 'readwrite', (store) => store.delete(id))
  await putCustomPhoto(id, null)
  const ready = readyState()
  set({ ...ready, drinks: ready.drinks.filter((drink) => drink.id !== id) })
}

// Eight lowercase letters and digits, for the random part of a Custom Drink ID.
export function shortId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (byte) => '0123456789abcdefghijklmnopqrstuvwxyz'[byte % 36]).join('')
}

export type DrinksState = { status: 'loading' | 'ready'; drinks: Drink[]; photos: Photos }

const byName = (a: Drink, b: Drink) => a.name.localeCompare(b.name)

// Every Drink, House and Custom, by name. While Custom Drinks load (or when
// the device won't store them) the House Drinks show on their own.
export function useDrinks(): DrinksState {
  const custom = useCustomDrinks()
  return useMemo(
    () =>
      custom.status === 'ready'
        ? { status: 'ready', drinks: [...houseDrinks, ...custom.drinks].sort(byName), photos: custom.photos }
        : { status: custom.status === 'loading' ? 'loading' : 'ready', drinks: houseDrinks, photos: {} },
    [custom],
  )
}
