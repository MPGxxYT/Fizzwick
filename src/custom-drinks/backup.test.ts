import { describe, expect, test } from 'vitest'
import type { Favorite } from '../favorites/favorite'
import { parseDrinkFile, type Drink } from '../riff-engine'
import cherryLimeadeFile from '../house-drinks/cherry-limeade.json'
import { BACKUP_VERSION, describeRestore, makeBackup, readBackup } from './backup'
import { copyDrink } from './copy-drink'

function parse(input: unknown): Drink {
  const result = parseDrinkFile(input)
  if (!result.ok) throw new Error(result.errors.join('\n'))
  return result.drink
}

const cherryLimeade = parse(cherryLimeadeFile)
const mine = copyDrink(cherryLimeade, cherryLimeade.houseSpec, [cherryLimeade.name], 'k3x9q2')
const other = copyDrink(cherryLimeade, { ...cherryLimeade.houseSpec, fizz: 'soda-water' }, [], 'p0p0p0p0')

const favorite = (id: string, drinkId: string): Favorite => ({
  id,
  drinkId,
  picks: {},
  name: 'Mine',
  note: 'less ice',
  createdAt: 1,
  updatedAt: 2,
  formatVersion: 1,
})

const photo = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0x00, 0x42])], { type: 'image/jpeg' })

// Through JSON, as the downloaded file is.
const asFile = async (drinks: Drink[], photos: Record<string, Blob>, favorites: Favorite[]) =>
  JSON.stringify(await makeBackup(drinks, photos, favorites))

const emptyPhone = { drinks: [], favorites: [] }

describe('the backup round trip', () => {
  test('restoring onto an empty phone gives back the same Drinks, photos and Favorites', async () => {
    const favorites = [favorite('f1', mine.id), favorite('f2', 'cherry-limeade')]
    const result = readBackup(await asFile([mine, other], { [mine.id]: photo }, favorites), emptyPhone)
    if (!result.ok) throw new Error(result.message)

    expect(result.restore.drinks.map(({ drink }) => drink)).toEqual([mine, other])
    const restoredPhoto = result.restore.drinks[0].photo!
    expect(restoredPhoto.type).toBe('image/jpeg')
    expect(new Uint8Array(await restoredPhoto.arrayBuffer())).toEqual(new Uint8Array(await photo.arrayBuffer()))
    expect(result.restore.drinks[1].photo).toBeNull()
    expect(result.restore.favorites).toEqual(favorites)
    expect(result.restore.skipped).toEqual([])
  })

  test('the file says its backup version and keeps each Drink file whole', async () => {
    const file = JSON.parse(await asFile([mine], { [mine.id]: photo }, []))
    expect(file.backupVersion).toBe(BACKUP_VERSION)
    expect(file.drinks[0].formatVersion).toBe(mine.formatVersion)
    expect(file.drinks[0].photo).toMatch(/^data:image\/jpeg;base64,/)
  })
})

describe('readBackup', () => {
  test.each([
    ['not JSON', 'hello'],
    ['JSON without a backup version', JSON.stringify({ drinks: [], favorites: [] })],
    ['a Drink file', JSON.stringify(cherryLimeadeFile)],
    ['a backup with no drinks list', JSON.stringify({ backupVersion: 1, favorites: [] })],
  ])('refuses %s', (_, text) => {
    expect(readBackup(text, emptyPhone)).toEqual({ ok: false, message: "That file isn't a Fizzwick backup." })
  })

  test('refuses a backup from a newer Fizzwick', () => {
    const result = readBackup(JSON.stringify({ backupVersion: 2, drinks: [], favorites: [] }), emptyPhone)
    expect(result).toEqual({ ok: false, message: 'That backup is from a newer Fizzwick. Update the app, then restore it.' })
  })

  test('skips and names a Drink that fails to parse, and a House Drink', async () => {
    const file = JSON.parse(await asFile([mine], {}, []))
    file.drinks.push({ ...mine, id: 'my-broken', name: 'Broken Fizz', glass: 'bucket' }, cherryLimeadeFile, {})
    const result = readBackup(JSON.stringify(file), emptyPhone)
    if (!result.ok) throw new Error(result.message)
    expect(result.restore.drinks.map(({ drink }) => drink.id)).toEqual([mine.id])
    expect(result.restore.skipped).toEqual(['Broken Fizz', 'Cherry Limeade', 'A drink with no name'])
  })

  test('skips a Favorite it can’t read', async () => {
    const file = JSON.parse(await asFile([], {}, [favorite('f1', mine.id)]))
    file.favorites.push({ id: 'f2' })
    const result = readBackup(JSON.stringify(file), emptyPhone)
    if (!result.ok) throw new Error(result.message)
    expect(result.restore.favorites.map((f) => f.id)).toEqual(['f1'])
    expect(result.restore.skippedFavorites).toBe(1)
  })

  test('counts what it adds and what it replaces', async () => {
    const text = await asFile([mine, other], {}, [favorite('f1', mine.id), favorite('f2', mine.id)])
    const result = readBackup(text, { drinks: [cherryLimeade, mine], favorites: [favorite('f1', mine.id)] })
    if (!result.ok) throw new Error(result.message)
    expect(result.restore.adding).toEqual({ drinks: 1, favorites: 1 })
    expect(result.restore.replacing).toEqual({ drinks: 1, favorites: 1 })
    expect(describeRestore(result.restore)).toBe('Adds 1 Drink and 1 Favorite. Replaces 1 Drink and 1 Favorite on this phone.')
  })

  test('a Drink replacing its own copy keeps its name', async () => {
    const result = readBackup(await asFile([mine], {}, []), { drinks: [{ ...mine, name: 'Renamed' }], favorites: [] })
    if (!result.ok) throw new Error(result.message)
    expect(result.restore.drinks[0].drink.name).toBe(mine.name)
  })

  test('adds " (2)" to a name another Drink has, and " (3)" when that is taken too', async () => {
    const clash = { ...other, id: 'my-zzzzzzzz', name: mine.name }
    const result = readBackup(await asFile([mine, clash], {}, []), {
      drinks: [{ ...mine, id: 'my-elsewhere' }],
      favorites: [],
    })
    if (!result.ok) throw new Error(result.message)
    expect(result.restore.drinks.map(({ drink }) => drink.name)).toEqual([`${mine.name} (2)`, `${mine.name} (3)`])
  })
})

describe('describeRestore', () => {
  test('says so when the backup is empty', async () => {
    const result = readBackup(await asFile([], {}, []), emptyPhone)
    if (!result.ok) throw new Error(result.message)
    expect(describeRestore(result.restore)).toBe('There are no Drinks or Favorites in this backup.')
  })

  test('counts plurals', async () => {
    const result = readBackup(await asFile([mine, other], {}, []), emptyPhone)
    if (!result.ok) throw new Error(result.message)
    expect(describeRestore(result.restore)).toBe('Adds 2 Drinks.')
  })
})

test('once done, it says what it did and names what it left out', async () => {
  const file = JSON.parse(await asFile([mine], {}, []))
  file.drinks.push({ name: 'Broken Fizz' })
  const result = readBackup(JSON.stringify(file), { drinks: [mine], favorites: [] })
  if (!result.ok) throw new Error(result.message)
  expect(describeRestore(result.restore, true)).toBe(
    "Replaced 1 Drink on this phone. Left out Broken Fizz, which couldn't be read.",
  )
})
