import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { findHouseDrink } from '../house-drinks/catalog'
import { MAX_SERVINGS, resolveRiff, type Drink, type Picks, type Slot } from '../riff-engine'
import { NotFound } from '../NotFound'
import { formatIngredient, GLASS_NAMES, METHOD_NAMES } from './format'
import { GlassIcon } from './GlassIcon'
import { PrototypeSwitcher } from './prototype-variants/PrototypeSwitcher'
import { name as nameA, VariantA } from './prototype-variants/VariantA'
import { name as nameB, VariantB } from './prototype-variants/VariantB'
import { name as nameC, VariantC } from './prototype-variants/VariantC'
import './drink-page.css'

// PROTOTYPE: look variants on ?variant=, dev builds only. Remove when one wins.
const VARIANTS = [
  { key: 'current', name: 'Current page' },
  { key: 'A', name: nameA },
  { key: 'B', name: nameB },
  { key: 'C', name: nameC },
]
const VARIANT_COMPONENTS = { A: VariantA, B: VariantB, C: VariantC }

export function DrinkPage() {
  const { drinkId = '' } = useParams()
  const drink = findHouseDrink(drinkId)
  if (!drink) return <NotFound />
  // Keyed so that moving to another Drink starts again from its House Spec.
  return <DrinkView key={drink.id} drink={drink} />
}

function DrinkView({ drink }: { drink: Drink }) {
  const [picks, setPicks] = useState<Picks>({}) // empty: the House Spec
  const [servings, setServings] = useState(1)
  const [photoFailed, setPhotoFailed] = useState(false)
  const riff = useMemo(() => resolveRiff(drink, picks, { servings }), [drink, picks, servings])

  const pick = (slotId: string, optionId: string | null) => setPicks({ ...riff.picks, [slotId]: optionId })

  const [params] = useSearchParams()
  const variantKey = import.meta.env.DEV ? (params.get('variant') ?? 'current') : 'current'
  const Variant = VARIANT_COMPONENTS[variantKey as keyof typeof VARIANT_COMPONENTS]
  if (import.meta.env.DEV && Variant) {
    return (
      <>
        <Variant
          drink={drink}
          riff={riff}
          pick={pick}
          reset={() => setPicks({})}
          servings={servings}
          setServings={setServings}
        />
        <PrototypeSwitcher variants={VARIANTS} current={variantKey} riff={riff} />
      </>
    )
  }

  return (
    <main className="drink-page">
      <nav>
        <Link to="/">All drinks</Link>
      </nav>

      <div className="drink-hero">
        {riff.isHouseSpec && !photoFailed ? (
          <img
            src={`${import.meta.env.BASE_URL}${drink.photo}`}
            alt={`${drink.name}, House Spec`}
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          <GlassIcon glass={riff.glass} colors={riff.colors} label={`${GLASS_NAMES[riff.glass]} in your Riff's colors`} />
        )}
      </div>

      <header>
        <h1>{drink.name}</h1>
        <p className="drink-meta">
          {GLASS_NAMES[riff.glass]} · {METHOD_NAMES[riff.method]}
        </p>
        <ul className="tags" aria-label="Flavor Tags">
          {drink.flavorTags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        {riff.dietaryTags.length > 0 && (
          <p className="dietary" aria-label="Dietary Tags">
            Contains {riff.dietaryTags.join(', ')}
          </p>
        )}
      </header>

      <section aria-labelledby="riff-heading">
        <div className="section-heading">
          <h2 id="riff-heading">Your Riff</h2>
          <button type="button" onClick={() => setPicks({})} disabled={riff.isHouseSpec}>
            Back to House Spec
          </button>
        </div>
        {drink.slots.map((slot) => (
          <SlotPicker key={slot.id} slot={slot} picked={riff.picks[slot.id]} onPick={(optionId) => pick(slot.id, optionId)} />
        ))}
      </section>

      <section aria-labelledby="ingredients-heading">
        <div className="section-heading">
          <h2 id="ingredients-heading">Ingredients</h2>
          <ServingsControl servings={servings} onChange={setServings} />
        </div>
        <ul className="ingredients">
          {riff.ingredients.map((ingredient, i) => {
            const { measure, name } = formatIngredient(ingredient)
            return (
              <li key={i}>
                <span className="measure">{measure}</span> <span>{name}</span>
              </li>
            )
          })}
        </ul>
        {riff.batchNotes.map((note) => (
          <p key={note} className="batch-note">
            {note}
          </p>
        ))}
      </section>

      <section aria-labelledby="steps-heading">
        <h2 id="steps-heading">Steps</h2>
        <ol className="steps" aria-labelledby="steps-heading">
          {riff.steps.map((step) => (
            <li key={step.id}>{step.text}</li>
          ))}
        </ol>
      </section>
    </main>
  )
}

// One radio chip per Option. Retired Options appear only while they're picked
// (from a Favorite or a link), so they can't be chosen again.
function SlotPicker({ slot, picked, onPick }: { slot: Slot; picked: string | null; onPick: (optionId: string | null) => void }) {
  const choices = slot.options.filter((option) => !option.retired || option.id === picked)
  return (
    <fieldset className="slot">
      <legend>{slot.label}</legend>
      <div className="chips">
        {choices.map((option) => (
          <label key={option.id} className="chip">
            <input
              type="radio"
              name={slot.id}
              checked={picked === option.id}
              onChange={() => onPick(option.id)}
            />
            <span>
              {option.label}
              {option.retired && ' (retired)'}
            </span>
          </label>
        ))}
        {slot.optional && (
          <label className="chip">
            <input type="radio" name={slot.id} checked={picked === null} onChange={() => onPick(null)} />
            <span>None</span>
          </label>
        )}
      </div>
    </fieldset>
  )
}

function ServingsControl({ servings, onChange }: { servings: number; onChange: (servings: number) => void }) {
  return (
    <div className="servings" role="group" aria-label="Servings">
      <button type="button" aria-label="Fewer servings" disabled={servings <= 1} onClick={() => onChange(servings - 1)}>
        −
      </button>
      <output aria-live="polite">
        {servings} {servings === 1 ? 'serving' : 'servings'}
      </output>
      <button
        type="button"
        aria-label="More servings"
        disabled={servings >= MAX_SERVINGS}
        onClick={() => onChange(servings + 1)}
      >
        +
      </button>
    </div>
  )
}
