import { useEffect, useState } from 'react'
import { isCustomDrinkId } from '../custom-drinks/copy-drink'
import { riffLink, type Drink, type Riff } from '../riff-engine'

// How long "Link copied" stays up, and the longer note on a Custom Drink.
const NOTE_MS = 2500
const LONG_NOTE_MS = 5000

// Until sharing arrives, a Custom Drink is only on the phone that made it,
// so its link opens nowhere else. The note says so before the share sheet
// opens.
export const ONLY_THIS_PHONE = 'Only opens on this phone until sharing arrives'

// Shares a link to the Riff on the page: the phone's share sheet where there
// is one, otherwise a copy to the clipboard. The link names IDs only.
export function ShareRiff({ drink, riff }: { drink: Drink; riff: Riff }) {
  const [note, setNote] = useState<string | null>(null)
  const onlyHere = isCustomDrinkId(drink.id)

  useEffect(() => {
    if (!note) return
    const timeout = window.setTimeout(() => setNote(null), onlyHere ? LONG_NOTE_MS : NOTE_MS)
    return () => window.clearTimeout(timeout)
  }, [note, onlyHere])

  const share = async () => {
    if (onlyHere) setNote(ONLY_THIS_PHONE)
    const url = new URL(riffLink(drink, riff.picks), window.location.origin).href
    if (navigator.share) {
      try {
        await navigator.share({ title: riff.name, text: riff.defaultFavoriteName, url })
      } catch {
        // Closed the share sheet: nothing to say.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setNote(onlyHere ? `Link copied. ${ONLY_THIS_PHONE}.` : 'Link copied')
    } catch {
      setNote("Couldn't copy. The link is in the address bar.")
    }
  }

  return (
    <>
      <button type="button" className="dp-share" aria-label="Share this Riff" onClick={share}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v12M7.5 7.5L12 3l4.5 4.5" />
          <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
        </svg>
      </button>
      <p className="dp-share-note" role="status">
        {note}
      </p>
    </>
  )
}
