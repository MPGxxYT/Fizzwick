import { useEffect, useSyncExternalStore } from 'react'
import { randomId, run } from '../db'
import type { Favorite } from './favorite'

// Favorites in IndexedDB on this device (ADR 0002). The list is loaded once
// and kept in memory; every change writes through and then updates the list,
// so screens using useFavorites stay in step.
export type FavoritesState =
  | { status: 'loading' }
  | { status: 'ready'; favorites: Favorite[] } // newest first
  | { status: 'unavailable' } // IndexedDB blocked or broken

let state: FavoritesState = { status: 'loading' }
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

function set(next: FavoritesState) {
  state = next
  for (const listener of listeners) listener()
}

const newestFirst = (a: Favorite, b: Favorite) => b.createdAt - a.createdAt

function load(): Promise<void> {
  return (loading ??= run<Favorite[]>('favorites', 'readonly', (store) => store.getAll()).then(
    (favorites) => set({ status: 'ready', favorites: favorites.sort(newestFirst) }),
    () => set({ status: 'unavailable' }),
  ))
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useFavorites(): FavoritesState {
  useEffect(() => void load(), [])
  return useSyncExternalStore(subscribe, () => state)
}

const others = (id: string) => (state.status === 'ready' ? state.favorites.filter((f) => f.id !== id) : [])

// Adds or replaces a Favorite. Rejects if the device won't store it.
// Both wait for the list first, so a change never replaces a list still loading.
export async function putFavorite(favorite: Favorite): Promise<void> {
  await load()
  await run('favorites', 'readwrite', (store) => store.put(favorite))
  set({ status: 'ready', favorites: [favorite, ...others(favorite.id)].sort(newestFirst) })
}

export async function deleteFavorite(id: string): Promise<void> {
  await load()
  await run('favorites', 'readwrite', (store) => store.delete(id))
  set({ status: 'ready', favorites: others(id) })
}

export const favoriteId = randomId
