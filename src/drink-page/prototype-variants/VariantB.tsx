// PROTOTYPE: throwaway. Variant B, "Layered glass": the glass is the hero and
// every Slot is a row of colored swatch cards you swipe through.
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { MAX_SERVINGS } from '../../riff-engine'
import { formatIngredient, GLASS_NAMES, METHOD_NAMES } from '../format'
import { GlassIcon } from '../GlassIcon'
import { glassInSentence, loadFont, type VariantProps } from './types'
import './variant-b.css'

export const name = 'Layered glass'

export function VariantB({ drink, riff, pick, reset, servings, setServings }: VariantProps) {
  const [tab, setTab] = useState<'ingredients' | 'steps'>('ingredients')
  useEffect(() => loadFont('https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700&family=DM+Sans:opsz,wght@9..40,400;9..40,600&display=swap'), [])

  return (
    <div className="vb">
      <main className="vb-page">
        <Link to="/" className="vb-back">
          All drinks
        </Link>

        <div className="vb-hero">
          <GlassIcon glass={riff.glass} colors={riff.colors} label={`${GLASS_NAMES[riff.glass]} in your Riff's colors`} />
          <h1>{drink.name}</h1>
          <p>
            {METHOD_NAMES[riff.method]} in a {glassInSentence(GLASS_NAMES[riff.glass])}
            {riff.dietaryTags.length > 0 && <span className="vb-dietary">Contains {riff.dietaryTags.join(', ')}</span>}
          </p>
          <button type="button" className="vb-reset" onClick={reset} disabled={riff.isHouseSpec}>
            {riff.isHouseSpec ? 'This is the House Spec' : 'Back to the House Spec'}
          </button>
        </div>

        {drink.slots.map((slot) => (
          <section key={slot.id} className="vb-slot" aria-label={slot.label}>
            <h2>{slot.label}</h2>
            <div className="vb-cards" role="radiogroup" aria-label={slot.label}>
              {slot.options
                .filter((option) => !option.retired || option.id === riff.picks[slot.id])
                .map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={riff.picks[slot.id] === option.id}
                    className="vb-card"
                    style={{ '--swatch': option.color } as React.CSSProperties}
                    onClick={() => pick(slot.id, option.id)}
                  >
                    <span className="vb-swatch" />
                    {option.label}
                  </button>
                ))}
              {slot.optional && (
                <button
                  type="button"
                  role="radio"
                  aria-checked={riff.picks[slot.id] === null}
                  className="vb-card vb-card-none"
                  onClick={() => pick(slot.id, null)}
                >
                  <span className="vb-swatch" />
                  Skip it
                </button>
              )}
            </div>
          </section>
        ))}

        <div className="vb-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'ingredients'} onClick={() => setTab('ingredients')}>
            Ingredients
          </button>
          <button type="button" role="tab" aria-selected={tab === 'steps'} onClick={() => setTab('steps')}>
            Steps
          </button>
        </div>

        {tab === 'ingredients' ? (
          <div className="vb-panel" role="tabpanel">
            <div className="vb-servings">
              <button type="button" aria-label="Fewer servings" disabled={servings <= 1} onClick={() => setServings(servings - 1)}>
                −
              </button>
              <span>
                {servings} {servings === 1 ? 'glass' : 'glasses'}
              </span>
              <button
                type="button"
                aria-label="More servings"
                disabled={servings >= MAX_SERVINGS}
                onClick={() => setServings(servings + 1)}
              >
                +
              </button>
            </div>
            <ul className="vb-ingredients">
              {riff.ingredients.map((ingredient, i) => {
                const { measure, name } = formatIngredient(ingredient)
                return (
                  <li key={i}>
                    <span>{name}</span>
                    <span className="vb-measure">{measure}</span>
                  </li>
                )
              })}
            </ul>
            {riff.batchNotes.map((note) => (
              <p key={note} className="vb-note">
                {note}
              </p>
            ))}
          </div>
        ) : (
          <ol className="vb-panel vb-steps" role="tabpanel">
            {riff.steps.map((step) => (
              <li key={step.id}>{step.text}</li>
            ))}
          </ol>
        )}
      </main>
    </div>
  )
}
