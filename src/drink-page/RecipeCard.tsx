import { useMemo, useState } from 'react'
import { markBarTerms } from '../bar-terms'
import { MAX_SERVINGS, type Riff } from '../riff-engine'
import { formatIngredient, isMakeAhead, TOOL_NAMES } from './format'
import { TermText } from './TermText'

// The ingredients with a drink count, then the steps. Anything to do ahead
// comes first and the tools come after the ingredients, so nothing in step
// mode is a surprise. Changing the count
// rolls each amount that changes: up from below when adding drinks, down from
// above when removing. Amounts are keyed by their text, so only the ones that
// change remount and roll, and nothing rolls until the count first changes.
export function RecipeCard({
  riff,
  onServings,
  changeColor,
}: {
  riff: Riff
  onServings: (servings: number) => void
  // The color to mark a swap's changed lines in.
  changeColor: string
}) {
  const [direction, setDirection] = useState<'up' | 'down' | null>(null)
  const change = (next: number) => {
    setDirection(next > riff.servings ? 'up' : 'down')
    onServings(next)
  }

  // After a swap, the ingredient and step lines that weren't there before
  // wash in the picked Option's color and fade, so you can see what changed.
  // Lines are compared by their text. A changed drink count doesn't count
  // as a swap; its amounts roll instead.
  const lines = useMemo(
    () => ({
      ingredients: riff.ingredients.map((ingredient) => {
        const { measure, name } = formatIngredient(ingredient)
        return `${measure} ${name}`
      }),
      steps: riff.steps.map((step) => step.text),
    }),
    [riff],
  )
  const picksKey = JSON.stringify(riff.picks)
  const [swap, setSwap] = useState({ picksKey, lines, changed: new Set<string>(), count: 0 })
  if (swap.picksKey !== picksKey) {
    const before = new Set([...swap.lines.ingredients, ...swap.lines.steps])
    const changed = new Set([...lines.ingredients, ...lines.steps].filter((line) => !before.has(line)))
    setSwap({ picksKey, lines, changed, count: swap.count + 1 })
    // A swap remounts changed amounts; they shouldn't roll as if counted.
    setDirection(null)
  } else if (swap.lines !== lines) {
    setSwap({ ...swap, lines })
  }
  // Each swap gets fresh keys on its changed lines, so the wash plays again.
  const lineKey = (line: string, i: number) => (swap.changed.has(line) ? `${i}-swap-${swap.count}` : `${i}`)
  const lineClass = (line: string) => (swap.changed.has(line) ? 'is-changed' : undefined)

  const ahead = useMemo(() => riff.steps.filter(isMakeAhead), [riff])
  const { tools } = riff.miseEnPlace

  // The card is one screen for Bar Terms: each is underlined once, in reading
  // order. The make-ahead steps, each ingredient as its measure then its
  // name, the tools, then the steps.
  const marked = useMemo(
    () =>
      markBarTerms([
        ...ahead.map((step) => step.text),
        ...riff.ingredients.flatMap((ingredient) => {
          const { measure, name } = formatIngredient(ingredient)
          return [measure, name]
        }),
        // One list in a sentence: only the first tool keeps its capital.
        ...tools.map((tool, i) => (i === 0 ? TOOL_NAMES[tool] : TOOL_NAMES[tool].toLowerCase())),
        ...riff.steps.map((step) => step.text),
      ]),
    [riff, ahead, tools],
  )
  const ingredientsFrom = ahead.length
  const toolsFrom = ingredientsFrom + riff.ingredients.length * 2
  const stepsFrom = toolsFrom + tools.length

  return (
    <section
      className="dp-card"
      aria-labelledby="dp-need-heading"
      data-counting={direction ?? undefined}
      style={{ '--count-from': direction === 'down' ? '-0.7em' : '0.7em', '--change': changeColor } as React.CSSProperties}
    >
      <div className="dp-card-head">
        <h2 id="dp-need-heading">You'll need</h2>
        <div className="dp-servings" role="group" aria-label="Servings">
          <button type="button" aria-label="Fewer servings" disabled={riff.servings <= 1} onClick={() => change(riff.servings - 1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 12h12" />
            </svg>
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
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 12h12M12 6v12" />
            </svg>
          </button>
        </div>
      </div>

      {ahead.map((step, i) => (
        <p key={step.id} className="dp-ahead">
          <strong>Make ahead</strong>
          <TermText segments={marked[i]} />
        </p>
      ))}

      <ul className="dp-ingredients" aria-label="Ingredients">
        {riff.ingredients.map((ingredient, i) => {
          const { measure } = formatIngredient(ingredient)
          return (
            <li key={lineKey(lines.ingredients[i], i)} className={lineClass(lines.ingredients[i])}>
              <span className="dp-measure-slot">
                <span key={measure} className={ingredient.amount === undefined ? 'dp-measure' : 'dp-measure dp-count'}>
                  <TermText segments={marked[ingredientsFrom + i * 2]} />
                </span>
              </span>
              <span>
                <TermText segments={marked[ingredientsFrom + i * 2 + 1]} />
              </span>
            </li>
          )
        })}
      </ul>
      {riff.batchNotes.map((note) => (
        <p key={note} className="dp-note">
          {note}
        </p>
      ))}
      {tools.length > 0 && (
        <p className="dp-tools">
          <strong>Tools</strong>{' '}
          {tools.map((tool, i) => (
            <span key={tool}>
              {i > 0 && ', '}
              <TermText segments={marked[toolsFrom + i]} />
            </span>
          ))}
        </p>
      )}

      <h2 id="dp-steps-heading">How to make it</h2>
      <ol className="dp-steps" aria-labelledby="dp-steps-heading">
        {riff.steps.map((step, i) => (
          <li key={lineKey(step.text, i) + step.id} className={lineClass(step.text)}>
            <TermText segments={marked[stepsFrom + i]} />
          </li>
        ))}
      </ol>
    </section>
  )
}
