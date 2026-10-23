import { useState } from 'react'
import type { Drink, Picks, Slot } from '../riff-engine'
import { readable } from './colors'
import { Sheet } from './Sheet'

// Each Slot's word gets its own underline style, so the words read as
// different things. The color comes from the picked Option. Dotted is left
// out: a dotted underline always means a Bar Term.
const LINE_STYLES = ['wavy', 'double', 'dashed', 'solid'] as const

function wordStyle(slotIndex: number, color: string | null): React.CSSProperties {
  if (color === null) return { color: 'var(--dp-soft)', textDecorationStyle: 'dashed', textDecorationThickness: '1px' }
  const line = LINE_STYLES[slotIndex % LINE_STYLES.length]
  return {
    color: readable(color),
    textDecorationStyle: line,
    // A wavy line grows taller with its thickness. Start it below the letters'
    // tails (the y in "syrup") and keep it modest so it clears the next line.
    ...(line === 'wavy' && { textDecorationThickness: '2px', textUnderlinePosition: 'under', textUnderlineOffset: '2px' }),
  }
}

// The Riff as a sentence: "Made with" on its own line, then one line per Slot
// so a swap never moves another Slot. Tapping a word opens a sheet of that
// Slot's Options. On page load the lines rise in one after another; after
// that only a newly picked word rises (its key changes, so it remounts).
export function RiffSentence({
  drink,
  picks,
  justPicked,
  onPick,
  onReset,
}: {
  drink: Drink
  picks: Picks
  justPicked: string | null
  onPick: (slotId: string, optionId: string | null) => void
  // Given once the Riff differs from the House Spec.
  onReset?: () => void
}) {
  const [openSlot, setOpenSlot] = useState<Slot | null>(null)

  const words = drink.slots.map((slot, i) => {
    const option = slot.options.find((candidate) => candidate.id === picks[slot.id])
    return {
      slot,
      style: wordStyle(i, option?.color ?? null),
      text: option ? option.label.toLowerCase() : `no ${slot.label.toLowerCase()}`,
      retired: option?.retired === true,
    }
  })
  const joiner = (i: number) => (i < words.length - 2 ? ', ' : i === words.length - 2 ? ' and ' : '.')

  const choose = (slotId: string, optionId: string | null) => {
    onPick(slotId, optionId)
    setOpenSlot(null)
  }

  return (
    <>
      <p className="dp-sentence">
        {/* Reset sits on the lead line, which always has room for it, so
            it appearing never moves the page. */}
        <span className="dp-sentence-line dp-lead dp-line-in">
          Made with
          {onReset && (
            <button type="button" className="dp-reset" onClick={onReset}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12a8 8 0 1 0 2.6-5.9" />
                <path d="M4 4v4.5h4.5" />
              </svg>
              Reset to House Spec
            </button>
          )}
        </span>
        {words.map(({ slot, style, text, retired }, i) => (
          <span key={slot.id} className="dp-sentence-line dp-line-in" style={{ animationDelay: `${(i + 1) * 90}ms` }}>
            <button
              key={picks[slot.id] ?? 'none'}
              type="button"
              className={justPicked === slot.id || justPicked === 'all' ? 'dp-word is-new' : 'dp-word'}
              style={style}
              aria-label={`${slot.label}: ${text}${retired ? ', retired' : ''}. Change`}
              onClick={() => setOpenSlot(slot)}
            >
              {text}
              {/* A Favorite can still use an Option that new Riffs can't pick. */}
              {retired && <span className="dp-retired">retired</span>}
              <span className="dp-joiner">{joiner(i)}</span>
            </button>
          </span>
        ))}
      </p>
      <p className="dp-hint">Tap an underlined word to swap it.</p>

      {openSlot && (
        <Sheet label={`Choose ${openSlot.label.toLowerCase()}`} onClose={() => setOpenSlot(null)}>
          <h2>{openSlot.label}</h2>
          <ul className="dp-options">
            {/* Retired Options only appear while they're picked, so they can't be chosen again. */}
            {openSlot.options
              .filter((option) => !option.retired || option.id === picks[openSlot.id])
              .map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    aria-pressed={picks[openSlot.id] === option.id}
                    onClick={() => choose(openSlot.id, option.id)}
                  >
                    <span className="dp-swatch" style={{ background: option.color }} />
                    {option.label}
                    {option.retired && ' (retired)'}
                  </button>
                </li>
              ))}
            {openSlot.optional && (
              <li>
                <button type="button" aria-pressed={picks[openSlot.id] === null} onClick={() => choose(openSlot.id, null)}>
                  <span className="dp-swatch dp-swatch-none" />
                  No {openSlot.label.toLowerCase()}
                </button>
              </li>
            )}
          </ul>
        </Sheet>
      )}
    </>
  )
}
