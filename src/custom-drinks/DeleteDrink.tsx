import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Sheet } from '../drink-page/Sheet'
import { deleteFavorite, useFavorites } from '../favorites/store'
import type { Drink } from '../riff-engine'
import { deleteCustomDrink } from './store'

// Deletes a Custom Drink after asking, along with its Favorites, then goes
// back to the Drink list. The sheet says how many Favorites go too.
export function DeleteDrink({ drink }: { drink: Drink }) {
  const navigate = useNavigate()
  const favorites = useFavorites()
  const [asking, setAsking] = useState(false)
  const [failed, setFailed] = useState(false)
  const ofDrink = favorites.status === 'ready' ? favorites.favorites.filter((f) => f.drinkId === drink.id) : []

  const remove = async () => {
    try {
      for (const favorite of ofDrink) await deleteFavorite(favorite.id)
      // Leave the page first, so it never shows the Drink as missing.
      navigate('/', { replace: true })
      await deleteCustomDrink(drink.id)
    } catch {
      setFailed(true)
    }
  }

  return (
    <>
      <button type="button" className="dp-delete" onClick={() => setAsking(true)}>
        Delete this drink
      </button>
      {asking && (
        <Sheet label={`Delete ${drink.name}?`} onClose={() => setAsking(false)}>
          <h2>Delete {drink.name}?</h2>
          <p className="dp-delete-warning">
            {ofDrink.length > 0 &&
              `This also removes your ${ofDrink.length} ${ofDrink.length === 1 ? 'Favorite' : 'Favorites'} of it. `}
            You can't undo this.
          </p>
          {failed && <p role="status">This browser wouldn't delete it. Try again.</p>}
          <button type="button" className="dp-delete-confirm" onClick={remove}>
            Delete
          </button>
        </Sheet>
      )}
    </>
  )
}
