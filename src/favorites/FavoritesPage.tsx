import { useId, useState } from 'react'
import { Link } from 'react-router'
import { GlassSketch } from '../drink-page/GlassSketch'
import { Sheet } from '../drink-page/Sheet'
import type { DrinkPageState } from '../drink-page/DrinkPage'
import { findHouseDrink } from '../house-drinks/catalog'
import { resolveRiff } from '../riff-engine'
import { favoritePicks, type Favorite } from './favorite'
import { deleteFavorite, putFavorite, useFavorites } from './store'
import '../drink-page/drink-page.css'
import './favorites.css'

// Every Favorite on this device, newest first. Tapping one opens its Riff;
// the pencil renames it, adds a note, or deletes it.
export function FavoritesPage() {
  const favorites = useFavorites()
  const [editing, setEditing] = useState<Favorite | null>(null)

  return (
    <div className="dp fv">
      <div className="dp-glow" aria-hidden="true" />
      <main className="dp-page">
        <Link to="/" className="dp-back">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          All drinks
        </Link>

        <header className="dp-head">
          <h1>Favorites</h1>
          <p className="dp-kicker">Saved on this device.</p>
        </header>

        {favorites.status === 'unavailable' && (
          <p className="fv-message">This browser won't keep Favorites, so there are none to show.</p>
        )}
        {favorites.status === 'ready' && favorites.favorites.length === 0 && (
          <div className="fv-message">
            <p>No Favorites yet. Open a drink, pick what you like, and tap Save to Favorites.</p>
            <Link to="/">See all drinks</Link>
          </div>
        )}
        {favorites.status === 'ready' && favorites.favorites.length > 0 && (
          <ul className="fv-list" aria-label="Favorites">
            {favorites.favorites.map((favorite) => (
              <li key={favorite.id}>
                <FavoriteCard favorite={favorite} onEdit={() => setEditing(favorite)} />
              </li>
            ))}
          </ul>
        )}
      </main>

      {editing && <EditSheet favorite={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function FavoriteCard({ favorite, onEdit }: { favorite: Favorite; onEdit: () => void }) {
  const drink = findHouseDrink(favorite.drinkId)
  const picks = drink ? favoritePicks(drink, favorite.picks) : null
  const riff = drink && picks ? resolveRiff(drink, picks) : null

  return (
    <article className="fv-card">
      {drink && riff ? (
        <Link
          to={`/drinks/${drink.id}`}
          state={{ favoritePicks: picks! } satisfies DrinkPageState}
          className="fv-open"
        >
          <GlassSketch glass={drink.glass} colors={riff.colors} className="fv-sketch" />
          <span className="fv-text">
            <span className="fv-name">{favorite.name}</span>
            {/* Default names start with the Drink's name already. */}
            {!favorite.name.startsWith(drink.name) && <span className="fv-drink">{drink.name}</span>}
            {favorite.note && <span className="fv-note">{favorite.note}</span>}
          </span>
        </Link>
      ) : (
        <div className="fv-open">
          <span className="fv-text">
            <span className="fv-name">{favorite.name}</span>
            <span className="fv-drink">This drink isn't in Fizzwick anymore.</span>
          </span>
        </div>
      )}
      <button type="button" className="fv-edit" aria-label={`Edit ${favorite.name}`} onClick={onEdit}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z" />
          <path d="M13.5 6.5l4 4" />
        </svg>
      </button>
    </article>
  )
}

// Rename, note and delete. Deleting asks for a second tap.
function EditSheet({ favorite, onClose }: { favorite: Favorite; onClose: () => void }) {
  const [name, setName] = useState(favorite.name)
  const [note, setNote] = useState(favorite.note)
  const [confirming, setConfirming] = useState(false)
  const [failed, setFailed] = useState(false)
  const nameId = useId()
  const noteId = useId()

  const save = (event: React.FormEvent) => {
    event.preventDefault()
    putFavorite({ ...favorite, name: name.trim() || favorite.name, note: note.trim(), updatedAt: Date.now() }).then(
      onClose,
      () => setFailed(true),
    )
  }
  const remove = () => {
    if (!confirming) return setConfirming(true)
    deleteFavorite(favorite.id).then(onClose, () => setFailed(true))
  }

  return (
    <Sheet label="Edit Favorite" onClose={onClose}>
      <h2>Edit Favorite</h2>
      <form className="fv-form" onSubmit={save}>
        <label htmlFor={nameId}>Name</label>
        <input id={nameId} value={name} onChange={(event) => setName(event.target.value)} />
        <label htmlFor={noteId}>Note</label>
        <textarea
          id={noteId}
          rows={3}
          placeholder="Half the syrup for Sam"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        {failed && (
          <p className="fv-error" role="alert">
            That didn't save on this device. Try again.
          </p>
        )}
        <div className="fv-actions">
          <button type="button" className="fv-delete" onClick={remove}>
            {confirming ? 'Tap again to delete' : 'Delete'}
          </button>
          <button type="submit" className="fv-save">
            Save
          </button>
        </div>
      </form>
    </Sheet>
  )
}
