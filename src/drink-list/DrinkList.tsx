import { useId, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { APP_NAME } from '../app-name'
import { Bubbles } from '../drink-page/Ambience'
import { readable } from '../drink-page/colors'
import { glassInSentence, GLASS_NAMES, METHOD_NAMES } from '../drink-page/format'
import { GlassSketch } from '../drink-page/GlassSketch'
import { houseDrinks } from '../house-drinks/catalog'
import { filterChoices, searchDrinks } from '../house-drinks/search'
import { FLAVOR_TAGS, METHODS, resolveRiff, type Drink, type FlavorTag, type Method } from '../riff-engine'
import './drink-list.css'

const CHOICES = filterChoices(houseDrinks)

// Passed to a Drink page so its "All drinks" link can return to this list.
export interface ListState {
  listSearch: string
}

const isMethod = (value: string | null): value is Method => (METHODS as readonly string[]).includes(value ?? '')
const isFlavor = (value: string | null): value is FlavorTag => (FLAVOR_TAGS as readonly string[]).includes(value ?? '')

// Home: every Drink, with search by name or ingredient and filters by Method
// and Flavor Tag. The search and filters live in the address, so coming back
// from a Drink shows the same list.
export function DrinkList() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const method = isMethod(params.get('method')) ? (params.get('method') as Method) : undefined
  const flavor = isFlavor(params.get('flavor')) ? (params.get('flavor') as FlavorTag) : undefined
  const found = useMemo(() => searchDrinks(houseDrinks, { query, method, flavor }), [query, method, flavor])

  const update = (key: 'q' | 'method' | 'flavor', value: string | undefined) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }
  const filtered = Boolean(query.trim() || method || flavor)
  const searchId = useId()

  return (
    <div className="dl">
      <div className="dp-glow" aria-hidden="true" />
      <Bubbles />
      <main className="dl-page">
        <header className="dl-head">
          <h1>{APP_NAME}</h1>
          <p>Pick a drink, then swap its parts to make it yours.</p>
        </header>

        <div className="dl-search">
          <label htmlFor={searchId} className="dl-visually-hidden">
            Search drinks or ingredients
          </label>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4.5 4.5" />
          </svg>
          <input
            id={searchId}
            type="search"
            placeholder="Search drinks or ingredients"
            value={query}
            onChange={(event) => update('q', event.target.value || undefined)}
          />
        </div>

        <FilterRow
          label="Method"
          choices={CHOICES.methods.map((value) => ({ value, name: METHOD_NAMES[value] }))}
          picked={method}
          onPick={(value) => update('method', value)}
        />
        <FilterRow
          label="Flavor"
          choices={CHOICES.flavors.map((value) => ({ value, name: value[0].toUpperCase() + value.slice(1) }))}
          picked={flavor}
          onPick={(value) => update('flavor', value)}
        />

        <p className="dl-count" aria-live="polite">
          {found.length} {found.length === 1 ? 'drink' : 'drinks'}
        </p>

        {found.length > 0 ? (
          <ul className="dl-drinks">
            {found.map((drink) => (
              <li key={drink.id}>
                <DrinkCard drink={drink} listSearch={params.toString()} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="dl-empty">
            <p>
              No drinks match{query.trim() ? ` "${query.trim()}"` : ''}
              {method || flavor ? ' with these filters' : ''}. Try fewer words or another filter.
            </p>
            {filtered && (
              <button type="button" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                Clear search and filters
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// One row of toggle chips. Tapping the picked chip again clears the filter.
function FilterRow<T extends string>({
  label,
  choices,
  picked,
  onPick,
}: {
  label: string
  choices: { value: T; name: string }[]
  picked: T | undefined
  onPick: (value: T | undefined) => void
}) {
  return (
    <div className="dl-filter" role="group" aria-label={label}>
      <span className="dl-filter-label">{label}</span>
      {choices.map((choice) => (
        <button
          key={choice.value}
          type="button"
          aria-pressed={picked === choice.value}
          onClick={() => onPick(picked === choice.value ? undefined : choice.value)}
        >
          {choice.name}
        </button>
      ))}
    </div>
  )
}

// A Drink as its House Spec: the photo, or until there is one, the glass
// drawn in the House Spec's colors. The name takes the first Slot's color,
// as it does on the Drink page. The list's search and filters travel along,
// so the Drink page's "All drinks" link returns to the same list.
function DrinkCard({ drink, listSearch }: { drink: Drink; listSearch: string }) {
  const houseSpec = useMemo(() => resolveRiff(drink), [drink])
  const [photoFailed, setPhotoFailed] = useState(false)
  const firstColor = drink.slots[0].options.find((option) => option.id === houseSpec.picks[drink.slots[0].id])?.color

  return (
    <Link to={`/drinks/${drink.id}`} state={{ listSearch } satisfies ListState} className="dl-card">
      <span className="dl-card-art">
        {photoFailed ? (
          <GlassSketch glass={drink.glass} colors={houseSpec.colors} className="dl-card-sketch" />
        ) : (
          <img src={`${import.meta.env.BASE_URL}${drink.photo}`} alt="" onError={() => setPhotoFailed(true)} />
        )}
      </span>
      <span className="dl-card-text">
        <span className="dl-card-name" style={firstColor ? { color: readable(firstColor) } : undefined}>
          {drink.name}
        </span>
        <span className="dl-card-meta">
          {METHOD_NAMES[drink.method]}, {glassInSentence(GLASS_NAMES[drink.glass])}
        </span>
        <span className="dl-card-tags">{drink.flavorTags.join(', ')}</span>
      </span>
    </Link>
  )
}
