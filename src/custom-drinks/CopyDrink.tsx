import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { DrinkPageState } from '../drink-page/DrinkPage'
import type { Drink, Riff } from '../riff-engine'
import { copyDrink } from './copy-drink'
import { putCustomDrink, shortId, useDrinks } from './store'

// Saves the Riff on the page as a new Custom Drink and opens it. The Drink
// page then says where the copy went.
export function CopyDrink({ drink, riff, pageState }: { drink: Drink; riff: Riff; pageState: DrinkPageState | null }) {
  const navigate = useNavigate()
  const { drinks } = useDrinks()
  const [failed, setFailed] = useState(false)

  const copy = async () => {
    const copied = copyDrink(
      drink,
      riff.picks,
      drinks.map((other) => other.name),
      shortId(),
    )
    try {
      await putCustomDrink(copied)
    } catch {
      setFailed(true)
      return
    }
    navigate(`/drinks/${copied.id}`, { state: { listSearch: pageState?.listSearch, copied: true } satisfies DrinkPageState })
  }

  return (
    <>
      <button type="button" className="dp-copy" aria-label="Make a copy" onClick={copy}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
          <path d="M15.5 5.5v-.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h.5" />
        </svg>
      </button>
      {failed && (
        <p className="dp-share-note" role="status">
          This browser won't save drinks, so the copy wasn't made.
        </p>
      )}
    </>
  )
}
