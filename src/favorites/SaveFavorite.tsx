import { useState } from 'react'
import type { Riff } from '../riff-engine'
import { newFavorite, sameRiff } from './favorite'
import { deleteFavorite, favoriteId, putFavorite, useFavorites } from './store'

const HEART = 'M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 6.1 5 5 0 0 1 21.2 11C19 15.6 12 20 12 20z'

// A heart for the Riff on the page: empty, or filled once it's a Favorite.
// Saving makes it beat twice. Removing cracks the filled heart in half,
// the halves wither and fall away, and the empty heart fades back in.
export function SaveFavorite({ riff }: { riff: Riff }) {
  const favorites = useFavorites()
  const [motion, setMotion] = useState<'beat' | 'crack' | null>(null)
  const [failed, setFailed] = useState(false)

  if (favorites.status === 'loading') return null
  const matches =
    favorites.status === 'ready'
      ? favorites.favorites.filter((favorite) => favorite.drinkId === riff.drinkId && sameRiff(favorite.picks, riff.picks))
      : []
  const saved = matches.length > 0
  // Filled while it beats, empty while it cracks, whatever the store says yet.
  const filled = motion === 'beat' || (saved && motion !== 'crack')

  const toggle = () => {
    setFailed(false)
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (saved) {
      setMotion(still ? null : 'crack')
      Promise.all(matches.map((favorite) => deleteFavorite(favorite.id))).catch(() => {
        setMotion(null)
        setFailed(true)
      })
    } else {
      setMotion(still ? null : 'beat')
      putFavorite(newFavorite(riff, favoriteId(), Date.now())).catch(() => {
        setMotion(null)
        setFailed(true)
      })
    }
  }

  return (
    <>
      <button
        type="button"
        className={`dp-fav${filled ? ' is-filled' : ''}${motion ? ` is-${motion}` : ''}`}
        aria-label={saved ? 'Remove from Favorites' : 'Save to Favorites'}
        aria-pressed={saved}
        onClick={toggle}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="dp-fav-heart"
          // The beat, or the empty heart fading back in after the crack.
          onAnimationEnd={() => setMotion(null)}
        >
          <path d={HEART} />
        </svg>
        {motion === 'crack' && (
          <span className="dp-fav-crack" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="dp-fav-half is-left">
              <path d={HEART} />
            </svg>
            <svg viewBox="0 0 24 24" className="dp-fav-half is-right">
              <path d={HEART} />
            </svg>
          </span>
        )}
      </button>
      {(failed || favorites.status === 'unavailable') && (
        <p className="dp-fav-error" role="alert">
          This browser won't keep Favorites.
        </p>
      )}
    </>
  )
}

export function Heart({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={filled ? 'is-filled' : undefined}>
      <path d={HEART} />
    </svg>
  )
}
