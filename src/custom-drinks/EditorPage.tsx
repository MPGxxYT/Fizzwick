import { useEffect, useId, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { GLASS_NAMES, METHOD_NAMES, TOOL_NAMES } from '../drink-page/format'
import { Sheet } from '../drink-page/Sheet'
import { NotFound } from '../NotFound'
import {
  DIETARY_TAGS,
  FLAVOR_TAGS,
  GLASSES,
  MEASURED_UNITS,
  METHOD_TOOLS,
  METHODS,
  riffLink,
  TOOLS,
  UNMEASURED_UNITS,
  type Drink,
  type DietaryTag,
  type Ingredient,
  type Option,
  type Picks,
  type Slot,
  type Step,
  type Tool,
} from '../riff-engine'
import { DrinkView } from '../drink-page/DrinkPage'
import { isCustomDrinkId } from './copy-drink'
import { blankDrink, checkDraft, newStepId, stepInUse, type FieldErrors } from './check-draft'
import type { Favorite } from '../favorites/favorite'
import { useFavorites } from '../favorites/store'
import { changed, dropDraft, getDraft, setDraft, type Draft } from './drafts'
import { PALETTE, suggestDietaryTags, suggestTools } from './suggest'
import { addOption, addSlot, favoritesPickingFrom, removeOption, removeSlot } from './edit-slots'
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
  const favoritesState = useFavorites()
  const favorites = favoritesState.status === 'ready' ? favoritesState.favorites : []
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
        <Slots draft={draft} errors={errors} favorites={favorites} onChange={update} />
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
  return (
    <section className="ed-section" aria-labelledby="ed-ingredients">
      <h2 id="ed-ingredients">Ingredients</h2>
      <p className="ed-hint">The ones every version uses. Ingredients that swap belong to a Slot's Options.</p>
      <IngredientRows
        name="ingredient"
        ingredients={draft.ingredients}
        errors={errors}
        errorKey="ingredients"
        onChange={(ingredients) => onChange({ ...draft, ingredients })}
      />
    </section>
  )
}

// Ingredient rows with an amount, a unit and a name, and a button to add
// one. `name` makes each field's label unique on the page.
function IngredientRows({
  name,
  ingredients,
  errors,
  errorKey,
  onChange,
}: {
  name: string
  ingredients: Ingredient[]
  errors: FieldErrors
  errorKey: string
  onChange: (ingredients: Ingredient[]) => void
}) {
  const setAt = (i: number, ingredient: Ingredient) =>
    onChange(ingredients.map((other, j) => (j === i ? ingredient : other)))
  return (
    <>
      {ingredients.length > 0 && (
        <ul className="ed-rows">
          {ingredients.map((ingredient, i) => (
            <li key={i} className="ed-ingredient">
              <div className="ed-ingredient-fields">
                <input
                  className="ed-input ed-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  aria-label={`Amount of ${name} ${i + 1}`}
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
                  aria-label={`Unit of ${name} ${i + 1}`}
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
                  aria-label={`${capitalize(name)} ${i + 1}`}
                  placeholder="fresh lime juice"
                  value={ingredient.name}
                  onChange={(event) => setAt(i, { ...ingredient, name: event.target.value })}
                />
                <button
                  type="button"
                  className="ed-icon"
                  aria-label={`Remove ${name} ${i + 1}`}
                  onClick={() => onChange(ingredients.filter((_, j) => j !== i))}
                >
                  <CrossIcon />
                </button>
              </div>
              <FieldError message={errors[`${errorKey}.${i}`]} />
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="ed-add"
        onClick={() => onChange([...ingredients, { name: '', amount: undefined, unit: 'oz' }])}
      >
        Add an ingredient
      </button>
    </>
  )
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function ArrowIcon({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
    </svg>
  )
}

// A text box and a button that adds something named by it. The name has to
// come first, since the new Slot's or Option's ID is made from it.
function AddNamed({ label, button, onAdd }: { label: string; button: string; onAdd: (name: string) => void }) {
  const [name, setName] = useState('')
  const add = () => {
    if (!name.trim()) return
    onAdd(name.trim())
    setName('')
  }
  return (
    <div className="ed-add-named">
      <input
        className="ed-input"
        aria-label={label}
        placeholder={label}
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') add()
        }}
      />
      <button type="button" className="ed-add" disabled={!name.trim()} onClick={add}>
        {button}
      </button>
    </div>
  )
}

// The Slots, each with its Options and House Spec pick. Removing a Slot that
// Favorites pick from asks first; removing an Option a Favorite uses retires
// it instead (removeOption).
function Slots({ draft, errors, favorites, onChange }: SectionProps & { favorites: Favorite[] }) {
  const [removing, setRemoving] = useState<Slot | null>(null)
  const picking = removing ? favoritesPickingFrom(draft.id, removing.id, favorites) : 0
  const move = (i: number, by: number) => {
    const slots = [...draft.slots]
    ;[slots[i], slots[i + by]] = [slots[i + by], slots[i]]
    onChange({ ...draft, slots })
  }
  const askToRemove = (slot: Slot) =>
    favoritesPickingFrom(draft.id, slot.id, favorites) > 0 ? setRemoving(slot) : onChange(removeSlot(draft, slot.id))

  return (
    <section className="ed-section" aria-labelledby="ed-slots">
      <h2 id="ed-slots">Slots</h2>
      <p className="ed-hint">
        The parts that swap, each with its Options. The House Spec is the Option the drink opens with.
      </p>
      <ol className="ed-rows">
        {draft.slots.map((slot, s) => (
          <li key={slot.id} className="ed-slot">
            <SlotEditor
              draft={draft}
              slot={slot}
              index={s}
              errors={errors}
              favorites={favorites}
              onChange={onChange}
              onMove={(by) => move(s, by)}
              onRemove={() => askToRemove(slot)}
            />
          </li>
        ))}
      </ol>
      <FieldError message={errors.slots} />
      <AddNamed label="New Slot, such as Fizz" button="Add a Slot" onAdd={(label) => onChange(addSlot(draft, label))} />

      {removing && (
        <Sheet label={`Remove ${removing.label}?`} onClose={() => setRemoving(null)}>
          <h2>Remove {removing.label}?</h2>
          <p className="ed-sheet-note">
            {picking} {picking === 1 ? 'Favorite picks' : 'Favorites pick'} from this Slot.{' '}
            {picking === 1 ? "It'll" : "They'll"} open without it.
          </p>
          <button
            type="button"
            className="dp-delete-confirm"
            onClick={() => {
              onChange(removeSlot(draft, removing.id))
              setRemoving(null)
            }}
          >
            Remove
          </button>
        </Sheet>
      )}
    </section>
  )
}

function SlotEditor({
  draft,
  slot,
  index,
  errors,
  favorites,
  onChange,
  onMove,
  onRemove,
}: SectionProps & {
  slot: Slot
  index: number
  favorites: Favorite[]
  onMove: (by: number) => void
  onRemove: () => void
}) {
  const setSlot = (next: Slot) => onChange({ ...draft, slots: draft.slots.map((other) => (other.id === slot.id ? next : other)) })
  const setHouseSpec = (optionId: string | null) => onChange({ ...draft, houseSpec: { ...draft.houseSpec, [slot.id]: optionId } })
  const pickable = slot.options.filter((option) => !option.retired)
  const retired = slot.options.filter((option) => option.retired)
  const label = slot.label.trim() || `Slot ${index + 1}`

  return (
    <>
      <div className="ed-slot-head">
        <input
          className="ed-input ed-slot-label"
          aria-label={`Slot ${index + 1} name`}
          value={slot.label}
          onChange={(event) => setSlot({ ...slot, label: event.target.value })}
        />
        <button type="button" className="ed-icon" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(-1)}>
          <ArrowIcon up />
        </button>
        <button
          type="button"
          className="ed-icon"
          aria-label={`Move ${label} down`}
          disabled={index === draft.slots.length - 1}
          onClick={() => onMove(1)}
        >
          <ArrowIcon up={false} />
        </button>
        <button type="button" className="ed-icon" aria-label={`Remove ${label}`} onClick={onRemove}>
          <CrossIcon />
        </button>
      </div>
      <p className="ed-hint">
        Steps name it <code>{`{${slot.id}}`}</code>.
      </p>
      <label className="ed-check">
        <input
          type="checkbox"
          checked={slot.optional === true}
          onChange={(event) => {
            const { optional: _optional, ...rest } = slot
            setSlot(event.target.checked ? { ...rest, optional: true } : rest)
            // A Slot that must be filled can't open empty.
            if (!event.target.checked && draft.houseSpec[slot.id] == null && pickable[0]) {
              onChange({
                ...draft,
                slots: draft.slots.map((other) => (other.id === slot.id ? rest : other)),
                houseSpec: { ...draft.houseSpec, [slot.id]: pickable[0].id },
              })
            }
          }}
        />
        Can be left empty
      </label>
      <FieldError message={errors[`slots.${index}`]} />

      <p className="ed-label">House Spec</p>
      <div className="ed-chips" role="group" aria-label={`House Spec for ${label}`}>
        {pickable.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={draft.houseSpec[slot.id] === option.id}
            onClick={() => setHouseSpec(option.id)}
          >
            {option.label.trim() || 'Unnamed'}
          </button>
        ))}
        {slot.optional && (
          <button type="button" aria-pressed={draft.houseSpec[slot.id] == null} onClick={() => setHouseSpec(null)}>
            None
          </button>
        )}
      </div>

      <p className="ed-label">Options</p>
      <ol className="ed-rows ed-options">
        {slot.options.map((option, o) =>
          option.retired ? null : (
            <li key={option.id} className="ed-option">
              <OptionEditor
                draft={draft}
                slot={slot}
                slotIndex={index}
                option={option}
                optionIndex={o}
                errors={errors}
                onChange={onChange}
                onRemove={() => onChange(removeOption(draft, slot.id, option.id, favorites))}
              />
            </li>
          ),
        )}
      </ol>
      {retired.length > 0 && (
        <p className="ed-hint">
          Retired, kept for Favorites: {retired.map((option) => option.label).join(', ')}.
        </p>
      )}
      <AddNamed
        label={`New ${label} Option`}
        button="Add an Option"
        onAdd={(name) => onChange(addOption(draft, slot.id, name))}
      />
    </>
  )
}

// Options that change steps or the Method came with a copied House Drink.
// The editor shows them but can't change them, and saves them as they are.
const changesSteps = (option: Option) =>
  Boolean(option.method || option.addSteps?.length || option.removeSteps?.length || option.durations)

function OptionEditor({
  draft,
  slot,
  slotIndex,
  option,
  optionIndex,
  errors,
  onChange,
  onRemove,
}: SectionProps & {
  slot: Slot
  slotIndex: number
  option: Option
  optionIndex: number
  onRemove: () => void
}) {
  const setOption = (next: Option) =>
    onChange({
      ...draft,
      slots: draft.slots.map((other) =>
        other.id === slot.id ? { ...other, options: other.options.map((o) => (o.id === option.id ? next : o)) } : other,
      ),
    })
  const name = `${slot.label.trim() || 'Slot'} Option ${optionIndex + 1}`
  const remove = (
    <button type="button" className="ed-icon" aria-label={`Remove ${name}`} onClick={onRemove}>
      <CrossIcon />
    </button>
  )

  if (changesSteps(option)) {
    return (
      <>
        <div className="ed-option-head">
          <p className="ed-option-fixed">{option.label}</p>
          {remove}
        </div>
        <p className="ed-hint">This Option changes the steps or Method, so it can't be edited here.</p>
      </>
    )
  }

  return (
    <>
      <div className="ed-option-head">
        <input
          className="ed-input"
          aria-label={name}
          value={option.label}
          onChange={(event) => setOption({ ...option, label: event.target.value })}
        />
        {remove}
      </div>
      <FieldError message={errors[`slots.${slotIndex}.options.${optionIndex}`]} />
      <label className="ed-label ed-phrase">
        <span>
          In steps, <code>{`{${slot.id}}`}</code> reads
        </span>
        <input
          className="ed-input"
          aria-label={`${name} step words`}
          placeholder={option.label.trim().toLowerCase()}
          value={option.phrase ?? ''}
          onChange={(event) => setOption({ ...option, phrase: event.target.value })}
        />
      </label>
      <IngredientRows
        name={`${name} ingredient`}
        ingredients={option.ingredients}
        errors={errors}
        errorKey={`slots.${slotIndex}.options.${optionIndex}.ingredients`}
        onChange={(ingredients) => setOption({ ...option, ingredients })}
      />
      <DietaryTags option={option} name={name} onChange={setOption} />
      <Swatches option={option} name={name} onChange={setOption} />
    </>
  )
}

// Tick boxes for the Dietary Tags. Words in the ingredients suggest some,
// but only a tick sets one.
function DietaryTags({ option, name, onChange }: { option: Option; name: string; onChange: (option: Option) => void }) {
  const ticked = option.dietaryTags ?? []
  const suggested = suggestDietaryTags(option.ingredients.map((ingredient) => ingredient.name))
  const toggle = (tag: DietaryTag) => {
    const next = DIETARY_TAGS.filter((other) => (other === tag ? !ticked.includes(tag) : ticked.includes(other)))
    const { dietaryTags: _old, ...rest } = option
    onChange(next.length > 0 ? { ...rest, dietaryTags: next } : rest)
  }
  return (
    <fieldset className="ed-tags">
      <legend className="ed-label">Contains</legend>
      {DIETARY_TAGS.map((tag) => {
        const hint = suggested.includes(tag) && !ticked.includes(tag)
        return (
          <label key={tag} className={hint ? 'ed-check is-suggested' : 'ed-check'}>
            <input
              type="checkbox"
              aria-label={`${name} contains ${tag}${hint ? ', suggested' : ''}`}
              checked={ticked.includes(tag)}
              onChange={() => toggle(tag)}
            />
            {capitalize(tag)}
            {hint && <span className="ed-suggested">suggested</span>}
          </label>
        )
      })}
    </fieldset>
  )
}

// The Option's color, for the glass drawing and the finish screen: one of
// the palette's swatches, or the color it came with.
function Swatches({ option, name, onChange }: { option: Option; name: string; onChange: (option: Option) => void }) {
  const own = PALETTE.some((swatch) => swatch.color === option.color) ? [] : [{ name: 'its own color', color: option.color }]
  return (
    <>
      <p className="ed-label">Color</p>
      <div className="ed-swatches" role="group" aria-label={`${name} color`}>
        {[...own, ...PALETTE].map((swatch) => (
          <button
            key={swatch.color}
            type="button"
            className="ed-swatch"
            style={{ background: swatch.color }}
            aria-label={swatch.name}
            aria-pressed={option.color === swatch.color}
            onClick={() => onChange({ ...option, color: swatch.color })}
          />
        ))}
      </div>
    </>
  )
}

// A step's tools beyond the ones its Method brings. Ticked tools show, and
// tools its words suggest show waiting for a tap; "More tools" shows the rest.
function StepTools({ draft, step, index, onChange }: { draft: Drink; step: Step; index: number; onChange: (step: Step) => void }) {
  const [all, setAll] = useState(false)
  const ticked = step.tools ?? []
  const suggested = suggestTools(step.text)
  const offered = TOOLS.filter((tool) => !METHOD_TOOLS[draft.method].includes(tool))
  const shown = all ? offered : offered.filter((tool) => ticked.includes(tool) || suggested.includes(tool))
  const toggle = (tool: Tool) => {
    const next = TOOLS.filter((other) => (other === tool ? !ticked.includes(tool) : ticked.includes(other)))
    const { tools: _old, ...rest } = step
    onChange(next.length > 0 ? { ...rest, tools: next } : rest)
  }
  return (
    <div className="ed-chips ed-tools" role="group" aria-label={`Tools for step ${index + 1}`}>
      {shown.map((tool) => {
        const hint = suggested.includes(tool) && !ticked.includes(tool)
        return (
          <button
            key={tool}
            type="button"
            className={hint ? 'is-suggested' : undefined}
            aria-pressed={ticked.includes(tool)}
            aria-label={`${TOOL_NAMES[tool]}${hint ? ', suggested' : ''}`}
            onClick={() => toggle(tool)}
          >
            {hint && '+ '}
            {TOOL_NAMES[tool]}
          </button>
        )
      })}
      {!all && shown.length < offered.length && (
        <button type="button" className="ed-more" onClick={() => setAll(true)}>
          More tools
        </button>
      )}
    </div>
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
      {METHOD_TOOLS[draft.method].length > 0 && (
        <p className="ed-hint">
          {METHOD_NAMES[draft.method]} already brings{' '}
          {METHOD_TOOLS[draft.method].map((tool) => TOOL_NAMES[tool].toLowerCase()).join(', ')}. Tick any other tools a
          step needs.
        </p>
      )}
      <ol className="ed-rows">
        {draft.steps.map((step, i) => {
          const inUse = stepInUse(draft, step.id)
          const timed = step.durationSeconds !== undefined
          return (
            <li key={step.id} className="ed-step">
              <div className="ed-step-head">
                <span className="ed-step-number">{i + 1}</span>
                <button type="button" className="ed-icon" aria-label={`Move step ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowIcon up />
                </button>
                <button
                  type="button"
                  className="ed-icon"
                  aria-label={`Move step ${i + 1} down`}
                  disabled={i === draft.steps.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowIcon up={false} />
                </button>
                <button
                  type="button"
                  className="ed-icon"
                  aria-label={`Remove step ${i + 1}`}
                  disabled={inUse}
                  title={inUse ? 'An Option uses this step' : undefined}
                  onClick={() => onChange({ ...draft, steps: draft.steps.filter((_, j) => j !== i) })}
                >
                  <CrossIcon />
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
              <StepTools draft={draft} step={step} index={i} onChange={(next) => setAt(i, next)} />
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
