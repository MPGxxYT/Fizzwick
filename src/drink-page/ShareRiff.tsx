import { useEffect, useState } from 'react'
import { riffLink, type Drink, type Riff } from '../riff-engine'

// How long "Link copied" stays up.
const NOTE_MS = 2500

// Shares a link to the Riff on the page: the phone's share sheet where there
// is one, otherwise a copy to the clipboard. The link names IDs only.
export function ShareRiff({ drink, riff }: { drink: Drink; riff: Riff }) {
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    if (!note) return
    const timeout = window.setTimeout(() => setNote(null), NOTE_MS)
    return () => window.clearTimeout(timeout)
  }, [note])

  const share = async () => {
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
      setNote('Link copied')
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
