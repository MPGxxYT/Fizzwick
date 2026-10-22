// PROTOTYPE: throwaway. Variant A, "Soda fountain menu": the Riff reads as a
// sentence and each Option is a word you tap to swap.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { MAX_SERVINGS, type Ingredient, type Slot } from '../../riff-engine'
import { formatIngredient, GLASS_NAMES, METHOD_NAMES } from '../format'
import { GlassSheet } from './GlassSheet'
import { GLASS_SIZES_OZ, glassInSentence, loadFont, type VariantProps } from './types'
import './variant-a.css'

export const name = 'Soda fountain menu'

// Each Slot gets its own underline, so the words read as different things.
const LINE_STYLES = ['wavy', 'dotted', 'double', 'dashed', 'solid'] as const

const NIGHT = [0x24, 0x17, 0x3b]
const WHITE = [0xfb, 0xf6, 0xff]

function luminance([r, g, b]: number[]): number {
  const [lr, lg, lb] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}

// An Option's color, lightened toward white until it reads on the night
// background. Dark colors such as tart cherry juice need the most help.
function readable(hex: string): string {
  const base = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const night = luminance(NIGHT)
  for (let t = 0; t <= 1; t += 0.05) {
    const mixed = base.map((c, i) => Math.round(c + (WHITE[i] - c) * t))
    const contrast = (luminance(mixed) + 0.05) / (night + 0.05)
    if (contrast >= 4.5) return `rgb(${mixed.join(' ')})`
  }
  return `rgb(${WHITE.join(' ')})`
}

// A lighter band below a wave, the same wave as the pour. The band is blurred
// so the wave fades in softly instead of ending in a hard line. It runs past
// the tile's sides and bottom so the blur only softens the wavy top edge.
const TITLE_WAVE_SHADE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100' preserveAspectRatio='none'%3E%3Cdefs%3E%3Cfilter id='soft' x='-20%25' y='-50%25' width='140%25' height='200%25'%3E%3CfeGaussianBlur stdDeviation='5'/%3E%3C/filter%3E%3C/defs%3E%3Cpath filter='url(%23soft)' fill='white' fill-opacity='0.24' d='M-25 54 Q-12.5 46 0 54 T25 54 T50 54 T75 54 T100 54 T125 54 T150 54 T175 54 T200 54 T225 54 V140 H-25 Z'/%3E%3C/svg%3E\")"

// The name, filled like a glass in one color: the Option in the Drink's first
// Slot (the cherry on Cherry Limeade). On first load it pours in from empty.
// When that Option changes, the new color fills up over the old one.
function Title({ drink, picks }: { drink: VariantProps['drink']; picks: VariantProps['riff']['picks'] }) {
  const first = drink.slots[0]
  const option = first?.options.find((candidate) => candidate.id === picks[first.id])
  const color = option ? readable(option.color) : '#ff8fb0'

  // React's "store information from previous renders" pattern: remember the
  // color being filled over, and whether the first pour has already happened.
  const [shown, setShown] = useState({ color, previous: null as string | null })
  if (shown.color !== color) setShown({ color, previous: shown.color })

  const words = drink.name.split(' ').map((word) => <span key={word}>{word}</span>)
  const lineCount = words.length
  // The primary color with a very slight shading: a touch lighter below a
  // wave line just past the middle, and a little darker toward the bottom.
  const paint = (c: string) => ({
    backgroundImage: `${TITLE_WAVE_SHADE}, linear-gradient(180deg, transparent 50%, rgba(20, 8, 40, 0.14)), linear-gradient(${c}, ${c})`,
    // One wave and one darkening per line of the name.
    backgroundSize: `100% ${100 / lineCount}%`,
    backgroundRepeat: 'repeat-y',
  })

  return (
    <h1 className="va-title">
      <span className="va-title-empty">{words}</span>
      {shown.previous && (
        <span className="va-title-solid" aria-hidden="true" style={paint(shown.previous)}>
          {words}
        </span>
      )}
      <span
        key={shown.color}
        className={shown.previous ? 'va-title-fill is-refill' : 'va-title-fill'}
        aria-hidden="true"
        style={paint(shown.color)}
      >
        {words}
      </span>
    </h1>
  )
}

// Fixed positions so the bubbles don't jump on every render.
const BUBBLES = Array.from({ length: 18 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 97.3 + n * 13.1) + 1) / 2) // 0..1, repeatable
  const top = Math.round(4 + r(7) * 92) // % down the page: its spot, not the screen's
  // Time grows with the distance to the top, so every bubble drifts at about
  // the same slow speed.
  const duration = Math.round((8 + top * 0.7) * (0.85 + r(3) * 0.3))
  return {
    left: `${Math.round(r(1) * 96)}%`,
    top: `${top}%`,
    size: `${(0.35 + r(2) * 0.9).toFixed(2)}rem`,
    duration: `${duration}s`,
    delay: `-${Math.round(r(4) * duration)}s`,
    sway: `${Math.round((r(5) - 0.5) * 50)}px`,
    alpha: (0.15 + r(6) * 0.25).toFixed(2),
  }
})

interface Fizz {
  id: number
  style: React.CSSProperties
}

// Scrolling releases one quick fizz bubble per this many pixels travelled.
const FIZZ_EVERY_PX = 60
const FIZZ_MAX = 24

function Bubbles() {
  const [fizz, setFizz] = useState<Fizz[]>([])
  const layer = useRef<HTMLDivElement>(null)
  const [pageHeight, setPageHeight] = useState(0)

  // The rise distance depends on how tall the page is.
  useEffect(() => {
    const element = layer.current
    if (!element) return
    setPageHeight(element.offsetHeight)
    const observer = new ResizeObserver(([entry]) => setPageHeight(Math.round(entry.contentRect.height)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let lastY = window.scrollY
    let travelled = 0
    let nextId = 0
    const onScroll = () => {
      travelled += Math.abs(window.scrollY - lastY)
      lastY = window.scrollY
      const count = Math.floor(travelled / FIZZ_EVERY_PX)
      if (count === 0) return
      travelled -= count * FIZZ_EVERY_PX
      const added = Array.from({ length: count }, () => {
        const size = 0.25 + Math.random() * 0.5
        // Somewhere in the part of the page on screen right now, rising to
        // the top edge of the screen at about 200px a second.
        const fromScreenTop = Math.round(window.innerHeight * (0.3 + Math.random() * 0.7))
        return {
          id: nextId++,
          style: {
            left: `${Math.round(Math.random() * 96)}%`,
            top: `${Math.round(window.scrollY + fromScreenTop)}px`,
            width: `${size}rem`,
            height: `${size}rem`,
            '--rise': `${fromScreenTop}px`,
            '--duration': `${Math.max(2, fromScreenTop / (170 + Math.random() * 60)).toFixed(1)}s`,
            '--sway': `${Math.round((Math.random() - 0.5) * 30)}px`,
            '--alpha': (0.3 + Math.random() * 0.25).toFixed(2),
          } as React.CSSProperties,
        }
      })
      setFizz((current) => [...current, ...added].slice(-FIZZ_MAX))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const pop = (id: number) => setFizz((current) => current.filter((bubble) => bubble.id !== id))

  return (
    <div className="va-bubbles" aria-hidden="true" ref={layer}>
      {fizz.map((bubble) => (
        <span key={`fizz-${bubble.id}`} className="va-fizz" style={bubble.style} onAnimationEnd={() => pop(bubble.id)} />
      ))}
      {BUBBLES.map((bubble, i) => (
        <span
          key={i}
          style={
            {
              left: bubble.left,
              width: bubble.size,
              height: bubble.size,
              '--duration': bubble.duration,
              '--delay': bubble.delay,
              '--sway': bubble.sway,
              '--alpha': bubble.alpha,
              top: bubble.top,
              // Distance from its spot to just past the top of the page.
              '--rise': `${Math.round((pageHeight * parseFloat(bubble.top)) / 100) + 32}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

// One spot per Slot, each in its own place on screen. An empty Slot keeps its
// last color so the spot fades out in that color instead of through grey.
function ColorSpots({ drink, picks }: { drink: VariantProps['drink']; picks: VariantProps['riff']['picks'] }) {
  const current: Record<string, string> = {}
  for (const slot of drink.slots) {
    const option = slot.options.find((candidate) => candidate.id === picks[slot.id])
    if (option) current[slot.id] = option.color
  }
  // Remember each Slot's last color across renders (React's "store
  // information from previous renders" pattern).
  const [lastColors, setLastColors] = useState(current)
  if (Object.entries(current).some(([slotId, color]) => lastColors[slotId] !== color)) {
    setLastColors({ ...lastColors, ...current })
  }

  return (
    <div className="va-glow" aria-hidden="true">
      {drink.slots.slice(0, 5).map((slot, i) => {
        const option = slot.options.find((candidate) => candidate.id === picks[slot.id])
        const color = current[slot.id] ?? lastColors[slot.id] ?? 'transparent'
        return (
          <div
            key={slot.id}
            className={`va-spot va-spot-${i}${option ? ' is-filled' : ''}`}
            style={
              {
                backgroundColor: color,
                // Each spot breathes on its own clock, so they never pulse together.
                '--breathe': `${9 + ((i * 1.7) % 4)}s`,
                '--breathe-delay': `-${(i * 3.1) % 9}s`,
              } as React.CSSProperties
            }
          />
        )
      })}
    </div>
  )
}

// Scales poured amounts (oz and ml) to the size of the user's own glass.
// Ice, Top, counts and dashes stay as they are.
function fitToGlass(ingredients: Ingredient[], ratio: number): Ingredient[] {
  if (ratio === 1) return ingredients
  return ingredients.map((ingredient) => {
    if (ingredient.amount === undefined) return ingredient
    if (ingredient.unit === 'oz') return { ...ingredient, amount: Math.max(0.25, Math.round(ingredient.amount * ratio * 4) / 4) }
    if (ingredient.unit === 'ml') return { ...ingredient, amount: Math.max(5, Math.round((ingredient.amount * ratio) / 5) * 5) }
    return ingredient
  })
}

export function VariantA({ drink, riff, pick, reset, servings, setServings }: VariantProps) {
  const [openSlot, setOpenSlot] = useState<Slot | null>(null)
  // Which way the drink count last moved, so changed amounts roll that way.
  const [countDirection, setCountDirection] = useState<'up' | 'down' | null>(null)
  const changeServings = (next: number) => {
    setCountDirection(next > servings ? 'up' : 'down')
    setServings(next)
  }
  // The Slot whose word should rise into place, or 'all' after a reset.
  const [justPicked, setJustPicked] = useState<string | null>(null)
  const choose = (slotId: string, optionId: string | null) => {
    pick(slotId, optionId)
    setJustPicked(slotId)
  }
  const [glassOpen, setGlassOpen] = useState(false)
  const [customOz, setCustomOz] = useState<number | null>(null)
  const standardOz = GLASS_SIZES_OZ[riff.glass]
  const ingredients = fitToGlass(riff.ingredients, (customOz ?? standardOz) / standardOz)
  useEffect(() => loadFont('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&family=Figtree:wght@400;600&display=swap'), [])

  const words = drink.slots.map((slot, i) => {
    const option = slot.options.find((candidate) => candidate.id === riff.picks[slot.id])
    const style: React.CSSProperties = option
      ? {
          color: readable(option.color),
          textDecorationStyle: LINE_STYLES[i % LINE_STYLES.length],
          // A wavy line's height grows with its thickness. Start it below the
          // letters' tails (the y in "syrup") and keep it modest, so it clears
          // both the word and the line below.
          ...(LINE_STYLES[i % LINE_STYLES.length] === 'wavy' && {
            textDecorationThickness: '2px',
            textUnderlinePosition: 'under',
            textUnderlineOffset: '2px',
          }),
        }
      : { color: 'var(--va-soft)', textDecorationStyle: 'dashed', textDecorationThickness: '1px' }
    return { slot, style, text: option ? option.label.toLowerCase() : `no ${slot.label.toLowerCase()}` }
  })

  return (
    <div className="va">
      <ColorSpots drink={drink} picks={riff.picks} />
      <Bubbles />
      <main className="va-page">
        <Link to="/" className="va-back">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          All drinks
        </Link>

        <header className="va-head">
          <Title drink={drink} picks={riff.picks} />
          <p className="va-kicker">
            {METHOD_NAMES[riff.method]}, in a{customOz !== null && ` ${customOz} oz`}{' '}
            <button type="button" className="va-glass-link" onClick={() => setGlassOpen(true)}>
              {glassInSentence(GLASS_NAMES[riff.glass])}
            </button>
          </p>
        </header>

        <p className="va-sentence">
          {/* On load the lines rise in one after another; after that, only a
              newly picked word rises (its key changes, so it remounts). */}
          <span className="va-sentence-line va-lead va-line-in">Made with</span>
          {words.map(({ slot, style, text }, i) => (
            // One line per Slot, so swapping an Option never moves another Slot.
            <span
              key={slot.id}
              className="va-sentence-line va-line-in"
              style={{ animationDelay: `${(i + 1) * 90}ms` }}
            >
              <button
                key={riff.picks[slot.id] ?? 'none'}
                type="button"
                className={justPicked === slot.id || justPicked === 'all' ? 'va-word is-new' : 'va-word'}
                style={style}
                onClick={() => setOpenSlot(slot)}
              >
                {text}
              </button>
              {i < words.length - 2 ? ', ' : i === words.length - 2 ? ' and ' : '.'}
            </span>
          ))}
        </p>
        <p className="va-hint">Tap an underlined word to swap it.</p>

        <div className="va-row">
          {riff.dietaryTags.length > 0 && <p className="va-dietary">Contains {riff.dietaryTags.join(', ')}</p>}
          {!riff.isHouseSpec && (
            <button
              type="button"
              className="va-reset"
              onClick={() => {
                reset()
                setJustPicked('all')
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12a8 8 0 1 0 2.6-5.9" />
                <path d="M4 4v4.5h4.5" />
              </svg>
              Reset to House Spec
            </button>
          )}
        </div>

        {/* Amounts are keyed by their text, so only the ones that change remount
            and roll; the roll only starts once the count has been changed. */}
        <section
          className="va-card"
          data-counting={countDirection ?? undefined}
          style={{ '--count-from': countDirection === 'down' ? '-0.7em' : '0.7em' } as React.CSSProperties}
        >
          <div className="va-card-head">
            <h2>You'll need</h2>
            <div className="va-servings">
              <button type="button" aria-label="Fewer servings" disabled={servings <= 1} onClick={() => changeServings(servings - 1)}>
                −
              </button>
              <span key={servings} className="va-count">
                {servings} {servings === 1 ? 'drink' : 'drinks'}
              </span>
              <button
                type="button"
                aria-label="More servings"
                disabled={servings >= MAX_SERVINGS}
                onClick={() => changeServings(servings + 1)}
              >
                +
              </button>
            </div>
          </div>
          <ul className="va-ingredients">
            {ingredients.map((ingredient, i) => {
              const { measure, name } = formatIngredient(ingredient)
              return (
                <li key={i}>
                  <span className="va-measure-slot">
                    <span key={measure} className={ingredient.amount === undefined ? 'va-measure' : 'va-measure va-count'}>
                      {measure}
                    </span>
                  </span>
                  <span>{name}</span>
                </li>
              )
            })}
          </ul>
          {riff.batchNotes.map((note) => (
            <p key={note} className="va-note">
              {note}
            </p>
          ))}

          <h2>How to make it</h2>
          <ol className="va-steps">
            {riff.steps.map((step) => (
              <li key={step.id}>{step.text}</li>
            ))}
          </ol>
        </section>
      </main>

      {glassOpen && (
        <GlassSheet
          glass={riff.glass}
          colors={riff.colors}
          customOz={customOz}
          setCustomOz={setCustomOz}
          onClose={() => setGlassOpen(false)}
        />
      )}

      {openSlot && (
        <div className="va-sheet-backdrop" onClick={() => setOpenSlot(null)}>
          <div className="va-sheet" role="dialog" aria-label={`Choose ${openSlot.label}`} onClick={(event) => event.stopPropagation()}>
            <h2>{openSlot.label}</h2>
            <ul>
              {openSlot.options
                .filter((option) => !option.retired || option.id === riff.picks[openSlot.id])
                .map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      aria-pressed={riff.picks[openSlot.id] === option.id}
                      onClick={() => {
                        choose(openSlot.id, option.id)
                        setOpenSlot(null)
                      }}
                    >
                      <span className="va-swatch" style={{ background: option.color }} />
                      {option.label}
                    </button>
                  </li>
                ))}
              {openSlot.optional && (
                <li>
                  <button
                    type="button"
                    aria-pressed={riff.picks[openSlot.id] === null}
                    onClick={() => {
                      choose(openSlot.id, null)
                      setOpenSlot(null)
                    }}
                  >
                    <span className="va-swatch va-swatch-none" />
                    No {openSlot.label.toLowerCase()}
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
