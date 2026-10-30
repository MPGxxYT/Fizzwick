import { useSyncExternalStore } from 'react'
import { readMyBar, type MyBar } from './my-bar'

// My Bar kept on this device in local storage. If storage can't be read or
// written (private browsing, full, blocked), it starts empty and ticks last
// until the page closes.
const KEY = 'fizzwick.my-bar'

function load(): MyBar {
  let saved: string | null = null
  try {
    saved = localStorage.getItem(KEY)
  } catch {
    // Unreadable: empty.
  }
  return readMyBar(saved)
}

let current = load()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Another tab changed it.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return
    current = load()
    listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function updateMyBar(change: Partial<MyBar>) {
  current = { ...current, ...change }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // Unwritable: keep the change for this visit only.
  }
  for (const listener of listeners) listener()
}

export function useMyBar(): MyBar {
  return useSyncExternalStore(subscribe, () => current)
}
