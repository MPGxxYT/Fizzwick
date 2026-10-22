import { useState } from 'react'
import { MAX_SERVINGS, type Riff } from '../riff-engine'
import { formatIngredient } from './format'

// The ingredients with a drink count, then the steps. Changing the count
// rolls each amount that changes: up from below when adding drinks, down from
// above when removing. Amounts are keyed by their text, so only the ones that
// change remount and roll, and nothing rolls until the count first changes.
export function RecipeCard({ riff, onServings }: { riff: Riff; onServings: (servings: number) => void }) {
  const [direction, setDirection] = useState<'up' | 'down' | null>(null)
  const change = (next: number) => {
    setDirection(next > riff.servings ? 'up' : 'down')
    onServings(next)
  }

  return (
    <section
      className="dp-card"
      aria-labelledby="dp-need-heading"
      data-counting={direction ?? undefined}
      style={{ '--count-from': direction === 'down' ? '-0.7em' : '0.7em' } as React.CSSProperties}
    >
      <div className="dp-card-head">
        <h2 id="dp-need-heading">You'll need</h2>
        <div className="dp-servings" role="group" aria-label="Servings">
          <button type="button" aria-label="Fewer servings" disabled={riff.servings <= 1} onClick={() => change(riff.servings - 1)}>
            −
          </button>
          <span key={riff.servings} className="dp-count" aria-live="polite">
            {riff.servings} {riff.servings === 1 ? 'drink' : 'drinks'}
          </span>
          <button
            type="button"
            aria-label="More servings"
            disabled={riff.servings >= MAX_SERVINGS}
            onClick={() => change(riff.servings + 1)}
          >
            +
          </button>
        </div>
      </div>

      <ul className="dp-ingredients" aria-label="Ingredients">
        {riff.ingredients.map((ingredient, i) => {
          const { measure, name } = formatIngredient(ingredient)
          return (
            <li key={i}>
              <span className="dp-measure-slot">
                <span key={measure} className={ingredient.amount === undefined ? 'dp-measure' : 'dp-measure dp-count'}>
                  {measure}
                </span>
              </span>
              <span>{name}</span>
            </li>
          )
        })}
      </ul>
      {riff.batchNotes.map((note) => (
        <p key={note} className="dp-note">
          {note}
        </p>
      ))}

      <h2 id="dp-steps-heading">How to make it</h2>
      <ol className="dp-steps" aria-labelledby="dp-steps-heading">
        {riff.steps.map((step) => (
          <li key={step.id}>{step.text}</li>
        ))}
      </ol>
    </section>
  )
}
