import { useId, useState } from 'react'
import { describeRestore, makeBackup, readBackup, type Restore } from '../custom-drinks/backup'
import { customPhotoBlobs, putCustomDrink, putCustomPhoto, useCustomDrinks } from '../custom-drinks/store'
import { Sheet } from '../drink-page/Sheet'
import { putFavorite, useFavorites } from '../favorites/store'
import { updateMyBar, useMyBar } from '../my-bar/use-my-bar'

// Download a backup of Custom Drinks, their photos, Favorites and My Bar as
// one file, or restore one after saying what it will add and replace.
export function BackupCard() {
  const inputId = useId()
  const custom = useCustomDrinks()
  const favorites = useFavorites()
  const myBar = useMyBar()
  const [restore, setRestore] = useState<Restore | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const ready = custom.status === 'ready' && favorites.status === 'ready'

  const download = async () => {
    if (!ready) return
    setMessage(null)
    try {
      const backup = await makeBackup(custom.drinks, await customPhotoBlobs(), favorites.favorites, myBar)
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `fizzwick-backup-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setMessage("This browser wouldn't make the backup. Try again.")
    }
  }

  const pick = async (file: File | undefined) => {
    if (!file || !ready) return
    setMessage(null)
    const result = readBackup(await file.text(), { drinks: custom.drinks, favorites: favorites.favorites })
    if (result.ok) setRestore(result.restore)
    else setMessage(result.message)
  }

  const apply = async (chosen: Restore) => {
    setRestore(null)
    try {
      for (const { drink, photo } of chosen.drinks) {
        await putCustomDrink(drink)
        await putCustomPhoto(drink.id, photo)
      }
      for (const favorite of chosen.favorites) await putFavorite(favorite)
      if (chosen.myBar) updateMyBar(chosen.myBar)
      setMessage(describeRestore(chosen, true))
    } catch {
      setMessage("This browser wouldn't save everything. Try restoring again.")
    }
  }

  return (
    <section className="st-card" aria-labelledby="st-backup">
      <h2 id="st-backup">Backup</h2>
      <p className="st-hint">
        Your drinks, Favorites and My Bar stay on this phone. A backup puts them, with their photos, in one file you can
        keep or restore on another phone.
      </p>
      <div className="st-backup-actions">
        <button type="button" className="st-button" disabled={!ready} onClick={download}>
          Download a backup
        </button>
        <label htmlFor={inputId} className="st-button">
          Restore from backup
        </label>
        <input
          id={inputId}
          className="st-visually-hidden"
          type="file"
          accept="application/json,.json"
          disabled={!ready}
          onChange={(event) => {
            void pick(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>
      <p className="st-backup-message" role="status">
        {message}
      </p>
      {restore && (
        <Sheet label="Restore this backup?" onClose={() => setRestore(null)}>
          <h2>Restore this backup?</h2>
          <p>{describeRestore(restore)}</p>
          {restore.skipped.length > 0 && (
            <>
              <p>{restore.skipped.length === 1 ? "This drink couldn't be read and stays out:" : "These drinks couldn't be read and stay out:"}</p>
              <ul className="st-skipped">
                {restore.skipped.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            </>
          )}
          {restore.skippedFavorites > 0 && (
            <p>
              {restore.skippedFavorites === 1
                ? "1 Favorite couldn't be read and stays out."
                : `${restore.skippedFavorites} Favorites couldn't be read and stay out.`}
            </p>
          )}
          <button type="button" className="st-restore-confirm" onClick={() => apply(restore)}>
            Restore
          </button>
        </Sheet>
      )}
    </section>
  )
}
