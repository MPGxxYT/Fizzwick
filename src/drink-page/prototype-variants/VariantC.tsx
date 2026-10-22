// PROTOTYPE: throwaway. Variant C, "Spec sheet": a bartender's spec card. Each
// Slot is a dropdown inside its ingredient row, and rows that differ from the
// House Spec are highlighted.
import { useEffect } from 'react'
import { Link } from 'react-router'
import { MAX_SERVINGS, type Ingredient } from '../../riff-engine'
import { formatIngredient, GLASS_NAMES, METHOD_NAMES } from '../format'
import { ingredientsBySlot, loadFont, type VariantProps } from './types'
import './variant-c.css'

export const name = 'Spec sheet'

const TOOL_NAMES: Record<string, string> = {
  'fine-strainer': 'fine strainer',
  'mixing-glass': 'mixing glass',
}

export function VariantC({ drink, riff, pick, reset, servings, setServings }: VariantProps) {
  useEffect(() => loadFont('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@400;500;700&display=swap'), [])
  const { fixed, slots } = ingredientsBySlot(drink, riff)
  const changed = drink.slots.filter((slot) => riff.picks[slot.id] !== drink.houseSpec[slot.id]).length

  return (
    <div className="vc">
      <main className="vc-page">
        <Link to="/" className="vc-back">
          All drinks
        </Link>

        <header className="vc-head">
          <h1>{drink.name}</h1>
          <dl>
            <div>
              <dt>Glass</dt>
              <dd>{GLASS_NAMES[riff.glass]}</dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>{METHOD_NAMES[riff.method]}</dd>
            </div>
            <div>
              <dt>Makes</dt>
              <dd>
                <select aria-label="Servings" value={servings} onChange={(event) => setServings(Number(event.target.value))}>
                  {Array.from({ length: MAX_SERVINGS }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'glass' : 'glasses'}
                    </option>
                  ))}
                </select>
              </dd>
            </div>
          </dl>
          {riff.dietaryTags.length > 0 && <p className="vc-dietary">Contains {riff.dietaryTags.join(', ')}</p>}
        </header>

        <div className="vc-spec-head">
          <h2>Spec</h2>
          {changed > 0 ? (
            <button type="button" onClick={reset}>
              {changed} {changed === 1 ? 'change' : 'changes'} from the House Spec. Reset
            </button>
          ) : (
            <span>House Spec</span>
          )}
        </div>

        <table className="vc-table">
          <tbody>
            {fixed.map((ingredient, i) => (
              <Row key={`fixed-${i}`} ingredient={ingredient} />
            ))}
            {drink.slots.map((slot) => {
              const ingredients = slots[slot.id]
              const isChanged = riff.picks[slot.id] !== drink.houseSpec[slot.id]
              const select = (
                <select
                  aria-label={slot.label}
                  value={riff.picks[slot.id] ?? ''}
                  onChange={(event) => pick(slot.id, event.target.value === '' ? null : event.target.value)}
                >
                  {slot.options
                    .filter((option) => !option.retired || option.id === riff.picks[slot.id])
                    .map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  {slot.optional && <option value="">No {slot.label.toLowerCase()}</option>}
                </select>
              )
              if (ingredients.length === 0) {
                return (
                  <tr key={slot.id} className={isChanged ? 'vc-changed' : undefined}>
                    <td className="vc-measure">None</td>
                    <td>
                      <span className="vc-slot">{slot.label}</span>
                      {select}
                    </td>
                  </tr>
                )
              }
              const label = slot.options.find((option) => option.id === riff.picks[slot.id])?.label.toLowerCase()
              return ingredients.map((ingredient, i) => (
                <Row
                  key={`${slot.id}-${i}`}
                  ingredient={ingredient}
                  changed={isChanged}
                  hideName={i === 0 && ingredient.name.toLowerCase() === label}
                >
                  {i === 0 && (
                    <>
                      <span className="vc-slot">{slot.label}</span>
                      {select}
                    </>
                  )}
                </Row>
              ))
            })}
          </tbody>
        </table>
        {riff.batchNotes.map((note) => (
          <p key={note} className="vc-note">
            {note}
          </p>
        ))}

        <h2 className="vc-steps-title">Method</h2>
        <ol className="vc-steps">
          {riff.steps.map((step) => (
            <li key={step.id}>
              <p>{step.text}</p>
              {step.tools.length > 0 && (
                <p className="vc-tools">{step.tools.map((tool) => TOOL_NAMES[tool] ?? tool).join(', ')}</p>
              )}
            </li>
          ))}
        </ol>
      </main>
    </div>
  )
}

function Row({
  ingredient,
  changed,
  hideName,
  children,
}: {
  ingredient: Ingredient
  changed?: boolean
  hideName?: boolean
  children?: React.ReactNode
}) {
  const { measure, name } = formatIngredient(ingredient)
  return (
    <tr className={changed ? 'vc-changed' : undefined}>
      <td className="vc-measure">{measure}</td>
      <td>
        {children}
        {!hideName && <span className={children ? 'vc-name vc-name-under' : 'vc-name'}>{name}</span>}
      </td>
    </tr>
  )
}
