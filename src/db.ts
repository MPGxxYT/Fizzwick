// The app's one IndexedDB database on this device (ADR 0002): Favorites, and
// from version 2 Custom Drinks. An upgrade only adds the stores that are
// missing, so Favorites saved under version 1 stay.
const DB_NAME = 'fizzwick'
const VERSION = 2
export type StoreName = 'favorites' | 'drinks'
const STORES: StoreName[] = ['favorites', 'drinks']

let database: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION)
    request.onupgradeneeded = () => {
      for (const name of STORES) {
        if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  // A failed open can be tried again later.
  database.catch(() => (database = null))
  return database
}

// Runs one request in its own transaction, resolving once it's written.
export function run<T>(
  name: StoreName,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(name, mode)
        const request = action(transaction.objectStore(name))
        transaction.oncomplete = () => resolve(request.result)
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error)
      }),
  )
}

// crypto.randomUUID needs a secure page, which a plain-HTTP home server isn't.
export function randomId(): string {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
