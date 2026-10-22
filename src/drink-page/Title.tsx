import { useState } from 'react'
import type { Drink, Picks } from '../riff-engine'
import { readable } from './colors'

// A lighter band below a wave on each line of the name, blurred so the wave
// fades in instead of ending in a hard line. It runs past the tile's sides and
// bottom so the blur only softens the wavy top edge.
const WAVE_SHADE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100' preserveAspectRatio='none'%3E%3Cdefs%3E%3Cfilter id='soft' x='-20%25' y='-50%25' width='140%25' height='200%25'%3E%3CfeGaussianBlur stdDeviation='5'/%3E%3C/filter%3E%3C/defs%3E%3Cpath filter='url(%23soft)' fill='white' fill-opacity='0.24' d='M-25 54 Q-12.5 46 0 54 T25 54 T50 54 T75 54 T100 54 T125 54 T150 54 T175 54 T200 54 T225 54 V140 H-25 Z'/%3E%3C/svg%3E\")"

const FALLBACK = '#ff8fb0'

// The Drink's name, one word per line, filled like a glass in the color of the
// Option in its first Slot (the cherry on Cherry Limeade). On page load it
// pours in from an empty outline. When that Option changes, the new color
// fills up over the old one.
export function Title({ drink, picks }: { drink: Drink; picks: Picks }) {
  const first = drink.slots[0]
  const option = first.options.find((candidate) => candidate.id === picks[first.id])
  const color = option ? readable(option.color) : FALLBACK

  // React's "store information from previous renders" pattern: remember the
  // color being filled over.
  const [shown, setShown] = useState({ color, previous: null as string | null })
  if (shown.color !== color) setShown({ color, previous: shown.color })

  const words = drink.name.split(' ').map((word, i) => <span key={i}>{word}</span>)
  const paint = (c: string) => ({
    backgroundImage: `${WAVE_SHADE}, linear-gradient(180deg, transparent 50%, rgba(20, 8, 40, 0.14)), linear-gradient(${c}, ${c})`,
    // One wave and one darkening per line of the name.
    backgroundSize: `100% ${100 / words.length}%`,
    backgroundRepeat: 'repeat-y',
  })

  return (
    // Labelled, because the stacked words would otherwise read as one ("CherryLimeade").
    <h1 className="dp-title" aria-label={drink.name}>
      <span className="dp-title-empty">{words}</span>
      {shown.previous && (
        <span className="dp-title-solid" aria-hidden="true" style={paint(shown.previous)}>
          {words}
        </span>
      )}
      <span
        key={shown.color}
        className={shown.previous ? 'dp-title-fill is-refill' : 'dp-title-fill'}
        aria-hidden="true"
        style={paint(shown.color)}
      >
        {words}
      </span>
    </h1>
  )
}
