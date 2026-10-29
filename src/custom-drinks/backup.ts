import { z } from 'zod'
import type { Favorite } from '../favorites/favorite'
import { parseDrinkFile, type Drink } from '../riff-engine'
import { isCustomDrinkId, nameTaken } from './copy-drink'

// The backup file Settings downloads and restores: every Custom Drink as a
// Drink file (ADR 0001), its photo embedded in the file's `photo` as a data
// URL, and every Favorite, House and Custom. `backupVersion` changes only
// when this wrapper does; each Drink keeps its own `formatVersion`.
export const BACKUP_VERSION = 1

export interface BackupFile {
  backupVersion: typeof BACKUP_VERSION
  drinks: Drink[]
  favorites: Favorite[]
}

export async function makeBackup(drinks: Drink[], photos: Record<string, Blob>, favorites: Favorite[]): Promise<BackupFile> {
  return {
    backupVersion: BACKUP_VERSION,
    drinks: await Promise.all(
      drinks.map(async (drink) => (photos[drink.id] ? { ...drink, photo: await toDataUrl(photos[drink.id]) } : drink)),
    ),
    favorites,
  }
}

// What a restore will do, worked out before anything is written so the user
// can be asked first.
export interface Restore {
  drinks: { drink: Drink; photo: Blob | null }[]
  favorites: Favorite[]
  // Names of the Drinks that couldn't be read, and how many Favorites.
  skipped: string[]
  skippedFavorites: number
  adding: { drinks: number; favorites: number }
  replacing: { drinks: number; favorites: number }
}

export type ReadBackupResult = { ok: true; restore: Restore } | { ok: false; message: string }

const NOT_A_BACKUP = "That file isn't a Fizzwick backup."

const favoriteSchema = z.object({
  id: z.string().min(1),
  drinkId: z.string().min(1),
  picks: z.record(z.string(), z.string().nullable()),
  name: z.string(),
  note: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  formatVersion: z.number(),
})

// Reads a backup file's text against what's on the phone. A Drink or
// Favorite with an ID already on the phone replaces it; a restored Drink
// whose name another Drink has gets " (2)" added (or " (3)", and so on).
// A Drink that doesn't parse, or whose ID isn't a Custom Drink's, is
// skipped and named.
export function readBackup(text: string, onPhone: { drinks: Drink[]; favorites: Favorite[] }): ReadBackupResult {
  let file: unknown
  try {
    file = JSON.parse(text)
  } catch {
    return { ok: false, message: NOT_A_BACKUP }
  }
  if (typeof file !== 'object' || file === null || !('backupVersion' in file)) return { ok: false, message: NOT_A_BACKUP }
  const { backupVersion, drinks, favorites } = file as { backupVersion: unknown; drinks?: unknown; favorites?: unknown }
  if (typeof backupVersion === 'number' && backupVersion > BACKUP_VERSION) {
    return { ok: false, message: 'That backup is from a newer Fizzwick. Update the app, then restore it.' }
  }
  if (backupVersion !== BACKUP_VERSION || !Array.isArray(drinks) || !Array.isArray(favorites)) {
    return { ok: false, message: NOT_A_BACKUP }
  }

  const readable: Drink[] = []
  const skipped: string[] = []
  for (const contents of drinks as unknown[]) {
    const result = parseDrinkFile(contents)
    if (result.ok && isCustomDrinkId(result.drink.id)) readable.push(result.drink)
    else skipped.push(nameOf(contents))
  }

  const restoredIds = new Set(readable.map((drink) => drink.id))
  const taken = onPhone.drinks.filter((drink) => !restoredIds.has(drink.id)).map((drink) => drink.name)
  const restored = readable.map(({ photo, ...drink }) => {
    let name = drink.name
    for (let n = 2; nameTaken(name, taken); n++) name = `${drink.name} (${n})`
    taken.push(name)
    return { drink: { ...drink, name }, photo: photo ? fromDataUrl(photo) : null }
  })

  const readFavorites = favorites.flatMap((contents: unknown) => {
    const result = favoriteSchema.safeParse(contents)
    return result.success ? [result.data] : []
  })

  const drinkIds = new Set(onPhone.drinks.map((drink) => drink.id))
  const favoriteIds = new Set(onPhone.favorites.map((favorite) => favorite.id))
  const replacingDrinks = restored.filter(({ drink }) => drinkIds.has(drink.id)).length
  const replacingFavorites = readFavorites.filter((favorite) => favoriteIds.has(favorite.id)).length
  return {
    ok: true,
    restore: {
      drinks: restored,
      favorites: readFavorites,
      skipped,
      skippedFavorites: favorites.length - readFavorites.length,
      adding: { drinks: restored.length - replacingDrinks, favorites: readFavorites.length - replacingFavorites },
      replacing: { drinks: replacingDrinks, favorites: replacingFavorites },
    },
  }
}

function nameOf(contents: unknown): string {
  const name = typeof contents === 'object' && contents !== null && 'name' in contents ? contents.name : undefined
  return typeof name === 'string' && name.trim() ? name : 'A drink with no name'
}

const count = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`

function listOf(drinks: number, favorites: number): string {
  const parts = [drinks > 0 && count(drinks, 'Drink'), favorites > 0 && count(favorites, 'Favorite')].filter(Boolean)
  return parts.join(' and ')
}

// "Adds 2 Drinks and 3 Favorites. Replaces 1 Drink on this phone." Once
// done, "Added ..." and "Replaced ...", with the skipped Drinks named.
export function describeRestore({ adding, replacing, skipped }: Restore, done = false): string {
  const adds = listOf(adding.drinks, adding.favorites)
  const replaces = listOf(replacing.drinks, replacing.favorites)
  if (!adds && !replaces) return 'There are no Drinks or Favorites in this backup.'
  const said = [
    adds && `${done ? 'Added' : 'Adds'} ${adds}.`,
    replaces && `${done ? 'Replaced' : 'Replaces'} ${replaces} on this phone.`,
  ]
  if (done && skipped.length > 0) said.push(`Left out ${skipped.join(', ')}, which couldn't be read.`)
  return said.filter(Boolean).join(' ')
}

async function toDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `data:${blob.type || 'image/jpeg'};base64,${btoa(binary)}`
}

// A photo that isn't an embedded image is left out; the card draws the glass.
function fromDataUrl(url: string): Blob | null {
  const match = /^data:(image\/[\w.+-]+);base64,(.*)$/s.exec(url)
  if (!match) return null
  try {
    const binary = atob(match[2])
    return new Blob([Uint8Array.from(binary, (char) => char.charCodeAt(0))], { type: match[1] })
  } catch {
    return null
  }
}
