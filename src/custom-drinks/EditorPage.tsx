import { useEffect, useId, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { GLASS_NAMES, METHOD_NAMES } from '../drink-page/format'
import { Sheet } from '../drink-page/Sheet'
import { NotFound } from '../NotFound'
import {
  FLAVOR_TAGS,
  GLASSES,
  MEASURED_UNITS,
  METHODS,
  riffLink,
  UNMEASURED_UNITS,
  type Drink,
  type Ingredient,
  type Picks,
  type Step,
} from '../riff-engine'
import { DrinkView } from '../drink-page/DrinkPage'
import { isCustomDrinkId } from './copy-drink'
import { blankDrink, checkDraft, newStepId, stepInUse, type FieldErrors } from './check-draft'
import { changed, dropDraft, getDraft, setDraft, type Draft } from './drafts'
import { putCustomDrink, shortId, useDrinks } from './store'
import '../drink-page/drink-page.css'
import './editor.css'

const UNIT_NAMES: Record<Ingredient['unit'], string> = {
  oz: 'oz',
  ml: 'ml',
  dash: 'dash',
  barspoon: 'barspoon',
  cup: 'cup',
  count: 'whole',
  top: 'Top',
  'to-taste': 'to taste',
  fill: 'fill glass',
}
const UNITS = [...MEASURED_UNITS, ...UNMEASURED_UNITS]
const isMeasured = (unit: Ingredient['unit']) => (MEASURED_UNITS as readonly string[]).includes(unit)
const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1)

// /new starts a blank Custom Drink and moves on to its editor.
export function NewDrinkPage() {
  const [id] = useState(() => {
    const drink = blankDrink(shortId())
    setDraft({ original: drink, draft: drink, isNew: true })
    return drink.id
  })
  return <Navigate to={`/edit/${id}`} replace />
}

// The editor's draft for a Drink: the one kept from an earlier visit to this
// editor or its Preview, or a fresh one from the saved Drink.
function useDraft(drinkId: string): { status: 'loading' | 'missing' | 'ready'; entry?: Draft } {
  const { status, drinks } = useDrinks()
  const kept = getDraft(drinkId)
  if (kept) return { status: 'ready', entry: kept }
  const saved = drinks.find((drink) => drink.id === drinkId)
  if (!saved || !isCustomDrinkId(drinkId)) return { status: status === 'loading' ? 'loading' : 'missing' }
  const entry = { original: saved, draft: saved, isNew: false }
  setDraft(entry)
  return { status: 'ready', entry }
}

export function EditorPage() {
  const { drinkId = '' } = useParams()
  const { status, entry } = useDraft(drinkId)
  if (status === 'loading') return <div className="dp" />
  if (!entry) return <NotFound />
  return <Editor key={drinkId} entry={entry} />
}

function Editor({ entry }: { entry: Draft }) {
  const navigate = useNavigate()
  const { drinks } = useDrinks()
  const [draft, setDraftState] = useState(entry.draft)
  const [leaving, setLeaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const update = (next: Drink) => {
    setDraftState(next)
    setDraft({ ...entry, draft: next })
  }

  const otherNames = useMemo(
    () => drinks.filter((drink) => drink.id !== draft.id).map((drink) => drink.name),
    [drinks, draft.id],
  )
  const { drink: ready, errors } = useMemo(() => checkDraft(draft, otherNames), [draft, otherNames])
  const dirty = changed({ ...entry, draft })

  // Closing the tab or reloading with unsaved changes asks the browser's way.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const exitTo = entry.isNew ? '/' : `/drinks/${draft.id}`
  const leave = () => {
    dropDraft(draft.id)
    navigate(exitTo, { replace: true })
  }
  const save = async () => {
    if (!ready) return
    try {
      await putCustomDrink(ready)
    } catch {
      setSaveFailed(true)
      return
    }
    dropDraft(draft.id)
    navigate(`/drinks/${ready.id}`, { replace: true })
  }

  return (
    <div className="dp ed">
      <div className="dp-glow" aria-hidden="true" />
      <main className="dp-page">
        <button type="button" className="dp-back ed-back" onClick={() => (dirty ? setLeaving(true) : leave())}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Cancel
        </button>
        <header className="dp-head">
          <h1>{entry.isNew ? 'New drink' : 'Edit drink'}</h1>
        </header>

        <Basics draft={draft} errors={errors} onChange={update} />
        <Ingredients draft={draft} errors={errors} onChange={update} />
        <Slots draft={draft} error={errors.slots} />
        <Steps draft={draft} errors={errors} onChange={update} />

        {errors.drink && (
          <p className="ed-error ed-general" role="alert">
            {errors.drink}
          </p>
        )}
      </main>

      <div className="ed-bar">
        {ready ? (
          <Link to={`/edit/${draft.id}/preview`} className="ed-preview">
            Preview
          </Link>
        ) : (
          <span className="ed-preview is-off" aria-disabled="true">
            Preview
          </span>
        )}
        <button type="button" className="ed-save" disabled={!ready} onClick={save}>
          Save
        </button>
      </div>
      {saveFailed && (
        <p className="ed-error ed-save-note" role="status">
          This browser won't save drinks, so nothing was saved.
        </p>
      )}

      {leaving && (
        <Sheet label="Leave without saving?" onClose={() => setLeaving(false)}>
          <h2>Leave without saving?</h2>
          <p className="ed-sheet-note">Your changes to this drink will be lost.</p>
          <button type="button" className="dp-delete-confirm" onClick={leave}>
            Leave
          </button>
        </Sheet>
      )}
    </div>
  )
}

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="ed-error">{message}</p> : null
}

// Chips that pick one value, or several when `many`.
function Chips<T extends string>({
  label,
  values,
  names,
  picked,
  onPick,
}: {
  label: string
  values: readonly T[]
  names: (value: T) => string
  picked: (value: T) => boolean
  onPick: (value: T) => void
}) {
  return (
    <div className="ed-chips" role="group" aria-label={label}>
      {values.map((value) => (
        <button key={value} type="button" aria-pressed={picked(value)} onClick={() => onPick(value)}>
          {names(value)}
        </button>
      ))}
    </div>
  )
}

type SectionProps = { draft: Drink; errors: FieldErrors; onChange: (next: Drink) => void }

function Basics({ draft, errors, onChange }: SectionProps) {
  const nameId = useId()
  return (
    <section className="ed-section" aria-labelledby={`${nameId}-h`}>
      <h2 id={`${nameId}-h`}>Basics</h2>
      <label htmlFor={nameId} className="ed-label">
        Name
      </label>
      <input
        id={nameId}
        className="ed-input"
        value={draft.name}
        autoComplete="off"
        onChange={(event) => onChange({ ...draft, name: event.target.value })}
      />
      <FieldError message={errors.name} />

      <p className="ed-label">Glass</p>
      <Chips
        label="Glass"
        values={GLASSES}
        names={(glass) => GLASS_NAMES[glass]}
        picked={(glass) => draft.glass === glass}
        onPick={(glass) => onChange({ ...draft, glass })}
      />

      <p className="ed-label">Method</p>
      <Chips
        label="Method"
        values={METHODS}
        names={(method) => METHOD_NAMES[method]}
        picked={(method) => draft.method === method}
        onPick={(method) => onChange({ ...draft, method })}
      />

      <p className="ed-label">Flavor Tags</p>
      <Chips
        label="Flavor Tags"
        values={FLAVOR_TAGS}
        names={capitalize}
        picked={(tag) => draft.flavorTags.includes(tag)}
        onPick={(tag) =>
          onChange({
            ...draft,
            flavorTags: draft.flavorTags.includes(tag)
              ? draft.flavorTags.filter((other) => other !== tag)
              : FLAVOR_TAGS.filter((other) => other === tag || draft.flavorTags.includes(other)),
          })
        }
      />
      <FieldError message={errors.flavorTags} />
    </section>
  )
}

// The fixed ingredients, outside any Slot.
function Ingredients({ draft, errors, onChange }: SectionProps) {
  const setAt = (i: number, ingredient: Ingredient) =>
    onChange({ ...draft, ingredients: draft.ingredients.map((other, j) => (j === i ? ingredient : other)) })
  return (
    <section className="ed-section" aria-labelledby="ed-ingredients">
      <h2 id="ed-ingredients">Ingredients</h2>
      <p className="ed-hint">The ones every version uses. Ingredients that swap belong to a Slot.</p>
      <ul className="ed-rows">
        {draft.ingredients.map((ingredient, i) => (
          <li key={i} className="ed-ingredient">
            <div className="ed-ingredient-fields">
              <input
                className="ed-input ed-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                aria-label={`Amount of ingredient ${i + 1}`}
                disabled={!isMeasured(ingredient.unit)}
                value={isMeasured(ingredient.unit) ? (ingredient.amount ?? '') : ''}
                onChange={(event) =>
                  setAt(i, {
                    ...ingredient,
                    amount: event.target.value === '' ? undefined : Number(event.target.value),
                  })
                }
              />
              <select
                className="ed-input ed-unit"
                aria-label={`Unit of ingredient ${i + 1}`}
                value={ingredient.unit}
                onChange={(event) => setAt(i, { ...ingredient, unit: event.target.value as Ingredient['unit'] })}
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {UNIT_NAMES[unit]}
                  </option>
                ))}
              </select>
              <input
                className="ed-input ed-ingredient-name"
                aria-label={`Ingredient ${i + 1}`}
                placeholder="fresh lime juice"
                value={ingredient.name}
                onChange={(event) => setAt(i, { ...ingredient, name: event.target.value })}
              />
              <button
                type="button"
                className="ed-icon"
                aria-label={`Remove ingredient ${i + 1}`}
                onClick={() => onChange({ ...draft, ingredients: draft.ingredients.filter((_, j) => j !== i) })}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <FieldError message={errors[`ingredients.${i}`]} />
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="ed-add"
        onClick={() => onChange({ ...draft, ingredients: [...draft.ingredients, { name: '', amount: undefined, unit: 'oz' }] })}
      >
        Add an ingredient
      </button>
    </section>
  )
}

// The Slots and their Options, with the House Spec's Option marked. Not
// editable yet.
function Slots({ draft, error }: { draft: Drink; error: string | undefined }) {
  return (
    <section className="ed-section" aria-labelledby="ed-slots">
      <h2 id="ed-slots">Slots</h2>
      <p className="ed-hint">The parts that swap. Steps name a Slot in braces, such as {'{fizz}'}.</p>
      {draft.slots.length > 0 ? (
        <ul className="ed-slots">
          {draft.slots.map((slot) => (
            <li key={slot.id}>
              <p className="ed-slot-name">
                {slot.label} <code>{`{${slot.id}}`}</code>
                {slot.optional && <span className="ed-tag">optional</span>}
              </p>
              <p className="ed-slot-options">
                {slot.options
                  .filter((option) => !option.retired)
                  .map((option) => (
                    <span key={option.id} className={draft.houseSpec[slot.id] === option.id ? 'is-house' : undefined}>
                      {option.label}
                    </span>
                  ))}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="ed-hint">The highlighted Option is the House Spec. Changing Slots and Options isn't here yet.</p>
      <FieldError message={error} />
    </section>
  )
}

function Steps({ draft, errors, onChange }: SectionProps) {
  const setAt = (i: number, step: Step) =>
    onChange({ ...draft, steps: draft.steps.map((other, j) => (j === i ? step : other)) })
  const move = (i: number, by: number) => {
    const steps = [...draft.steps]
    ;[steps[i], steps[i + by]] = [steps[i + by], steps[i]]
    onChange({ ...draft, steps })
  }
  const added = draft.slots.reduce(
    (count, slot) => count + slot.options.reduce((n, option) => n + (option.addSteps?.length ?? 0), 0),
    0,
  )

  return (
    <section className="ed-section" aria-labelledby="ed-steps">
      <h2 id="ed-steps">Steps</h2>
      <ol className="ed-rows">
        {draft.steps.map((step, i) => {
          const inUse = stepInUse(draft, step.id)
          const timed = step.durationSeconds !== undefined
          return (
            <li key={step.id} className="ed-step">
              <div className="ed-step-head">
                <span className="ed-step-number">{i + 1}</span>
                <button type="button" className="ed-icon" aria-label={`Move step ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 15l6-6 6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="ed-icon"
                  aria-label={`Move step ${i + 1} down`}
                  disabled={i === draft.steps.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="ed-icon"
                  aria-label={`Remove step ${i + 1}`}
                  disabled={inUse}
                  title={inUse ? 'An Option uses this step' : undefined}
                  onClick={() => onChange({ ...draft, steps: draft.steps.filter((_, j) => j !== i) })}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <textarea
                className="ed-input ed-step-text"
                aria-label={`Step ${i + 1}`}
                rows={2}
                value={step.text}
                onChange={(event) => setAt(i, { ...step, text: event.target.value })}
              />
              {draft.slots.length > 0 && (
                <div className="ed-insert" role="group" aria-label={`Name a Slot in step ${i + 1}`}>
                  {draft.slots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setAt(i, { ...step, text: `${step.text.trimEnd()} {${slot.id}}`.trimStart() })}
                    >
                      + {slot.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="ed-timer">
                <label>
                  <input
                    type="checkbox"
                    checked={timed}
                    onChange={(event) =>
                      setAt(i, { ...step, durationSeconds: event.target.checked ? 60 : undefined })
                    }
                  />{' '}
                  Timer
                </label>
                {timed && (
                  <>
                    <input
                      className="ed-input ed-time"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      aria-label={`Minutes for step ${i + 1}`}
                      value={Math.floor(step.durationSeconds! / 60)}
                      onChange={(event) =>
                        setAt(i, { ...step, durationSeconds: Number(event.target.value) * 60 + (step.durationSeconds! % 60) })
                      }
                    />
                    min
                    <input
                      className="ed-input ed-time"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="59"
                      aria-label={`Seconds for step ${i + 1}`}
                      value={step.durationSeconds! % 60}
                      onChange={(event) =>
                        setAt(i, {
                          ...step,
                          durationSeconds: Math.floor(step.durationSeconds! / 60) * 60 + Number(event.target.value),
                        })
                      }
                    />
                    sec
                  </>
                )}
              </div>
              {inUse && <p className="ed-hint">An Option changes this step, so it can't be removed.</p>}
              <FieldError message={errors[`steps.${i}`]} />
            </li>
          )
        })}
      </ol>
      <FieldError message={errors.steps} />
      <button
        type="button"
        className="ed-add"
        onClick={() => onChange({ ...draft, steps: [...draft.steps, { id: newStepId(draft), text: '' }] })}
      >
        Add a step
      </button>
      {added > 0 && (
        <p className="ed-hint">
          Some Options add {added === 1 ? 'a step' : `${added} steps`} of their own, which can't be changed here.
        </p>
      )}
    </section>
  )
}

// The Drink page for the unsaved draft. If the draft can't be shown (it has
// errors, or the editor was never opened), back to the editor.
export function PreviewPage() {
  const { drinkId = '', riff: pairs } = useParams()
  const { drinks } = useDrinks()
  const entry = getDraft(drinkId)
  const otherNames = drinks.filter((drink) => drink.id !== drinkId).map((drink) => drink.name)
  const ready = entry && checkDraft(entry.draft, otherNames).drink
  if (!ready) return <Navigate to={`/edit/${drinkId}`} replace />

  const linkFor = (picks: Picks) => {
    const riffPairs = riffLink(ready, picks).split('/')[3]
    return `/edit/${drinkId}/preview${riffPairs ? `/${riffPairs}` : ''}`
  }
  return <DrinkView drink={ready} pairs={pairs} preview={{ backTo: `/edit/${drinkId}`, linkFor }} />
}
