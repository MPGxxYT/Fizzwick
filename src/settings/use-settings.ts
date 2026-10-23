import { useSyncExternalStore } from 'react'
import { readSettings, type Settings } from './settings'

// Settings kept on this device in local storage. If storage can't be read or
// written (private browsing, full, blocked), the app runs on the defaults and
// changes last until the page closes.
const KEY = 'fizzwick.settings'

function load(): Settings {
  let saved: string | null = null
  try {
    saved = localStorage.getItem(KEY)
  } catch {
    // Unreadable: the defaults below.
  }
  return readSettings(saved, navigator.language)
}

let current = load()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Another tab changed them.
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

export function updateSettings(change: Partial<Settings>) {
  current = { ...current, ...change }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // Unwritable: keep the change for this visit only.
  }
  for (const listener of listeners) listener()
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, () => current)
}
