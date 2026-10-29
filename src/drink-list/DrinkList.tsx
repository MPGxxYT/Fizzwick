import { useId, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { APP_NAME } from '../app-name'
import { Bubbles } from '../drink-page/Ambience'
import { readable } from '../drink-page/colors'
import { glassInSentence, GLASS_NAMES, METHOD_NAMES, TOOL_NAMES } from '../drink-page/format'
import { GlassSketch } from '../drink-page/GlassSketch'
import { Sheet } from '../drink-page/Sheet'
import { Heart } from '../favorites/SaveFavorite'
import { isCustomDrinkId } from '../custom-drinks/copy-drink'
import { useDrinks } from '../custom-drinks/store'
import {
  filterChoices,
  groupIngredients,
  ingredientChoices,
  searchDrinks,
  toolChoices,
  type FoundDrink,
} from '../house-drinks/search'
import { FLAVOR_TAGS, METHODS, resolveRiff, riffLink, TOOLS, type FlavorTag, type Method, type Tool } from '../riff-engine'
import './drink-list.css'

// The card's ground, so the Drink names on it stay readable.
const CARD = '#2e2049'

// Passed to a Drink page so its "All drinks" link can return to this list.
export interface ListState {
  listSearch: string
}

const isMethod = (value: string | null): value is Method => (METHODS as readonly string[]).includes(value ?? '')
const isFlavor = (value: string | null): value is FlavorTag => (FLAVOR_TAGS as readonly string[]).includes(value ?? '')
const isTool = (value: string): value is Tool => (TOOLS as readonly string[]).includes(value)

// Home: every Drink, with search by name or ingredient and filters by Method,
// Flavor Tag, the tools you have and the ingredients you want to use. The
// search and filters live in the address, so coming back from a Drink shows
// the same list.
export function DrinkList() {
  const [params, setParams] = useSearchParams()
  const { drinks, photos } = useDrinks()
  const choices = useMemo(
    () => ({ ...filterChoices(drinks), tools: toolChoices(drinks), ingredients: ingredientChoices(drinks) }),
    [drinks],
  )
  const hasCustom = drinks.some((drink) => isCustomDrinkId(drink.id))
  const yours = params.get('yours') === '1'
  const query = params.get('q') ?? ''
  const method = isMethod(params.get('method')) ? (params.get('method') as Method) : undefined
  const flavor = isFlavor(params.get('flavor')) ? (params.get('flavor') as FlavorTag) : undefined
  // Joined into strings so the lists only change when the address does.
  const toolParam = params.getAll('tool').join(',')
  const ingredientParam = params.getAll('ing').join('\n')
  const tools = useMemo(() => (toolParam ? toolParam.split(',').filter(isTool) : []), [toolParam])
  const ingredients = useMemo(() => (ingredientParam ? ingredientParam.split('\n') : []), [ingredientParam])
  const found = useMemo(
    () =>
      searchDrinks(yours ? drinks.filter((drink) => isCustomDrinkId(drink.id)) : drinks, {
        query,
        method,
        flavor,
        ingredients,
        tools: tools.length > 0 ? tools : undefined,
      }),
    [drinks, yours, query, method, flavor, ingredients, tools],
  )
  const [sheet, setSheet] = useState<'tools' | 'ingredients' | null>(null)

  const update = (key: 'q' | 'method' | 'flavor' | 'yours', value: string | undefined) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }
  const updateAll = (key: 'tool' | 'ing', values: string[]) => {
    const next = new URLSearchParams(params)
    next.delete(key)
    for (const value of values) next.append(key, value)
    setParams(next, { replace: true })
  }
  const filters = Boolean(yours || method || flavor || tools.length > 0 || ingredients.length > 0)
  const filtered = Boolean(query.trim()) || filters
  const searchId = useId()

  return (
    <div className="dl">
      <div className="dp-glow" aria-hidden="true" />
      <Bubbles />
      <main className="dl-page">
        <Link to="/favorites" className="dl-favorites" aria-label="Favorites">
          <Heart />
        </Link>
        <Link to="/settings" className="dl-settings" aria-label="Settings">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </Link>
        <header className="dl-head">
          <h1>{APP_NAME}</h1>
          <p>Pick a drink, then swap its parts to make it yours.</p>
          <span className="dl-head-links">
            <Link to="/bar-terms" className="dl-terms-link">
              Bar Terms explained
            </Link>
            <Link to="/new" className="dl-terms-link">
              New drink
            </Link>
          </span>
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

        {hasCustom && (
          <div className="dl-filter" role="group" aria-label="Show">
            <span className="dl-filter-label">Show</span>
            <div className="dl-chips">
              <button type="button" aria-pressed={yours} onClick={() => update('yours', yours ? undefined : '1')}>
                Yours
              </button>
            </div>
          </div>
        )}
        <FilterRow
          label="Method"
          choices={byName(choices.methods.map((value) => ({ value, name: METHOD_NAMES[value] })))}
          picked={method}
          onPick={(value) => update('method', value)}
        />
        <FilterRow
          label="Flavor"
          choices={byName(choices.flavors.map((value) => ({ value, name: value[0].toUpperCase() + value.slice(1) })))}
          picked={flavor}
          onPick={(value) => update('flavor', value)}
        />
        <div className="dl-filter" role="group" aria-label="What you have">
          <span className="dl-filter-label">Have</span>
          <div className="dl-chips">
            <button type="button" aria-pressed={tools.length > 0} aria-haspopup="dialog" onClick={() => setSheet('tools')}>
              {tools.length === 0 ? 'Tools' : tools.length === 1 ? TOOL_NAMES[tools[0]] : `${tools.length} tools`}
            </button>
            <button
              type="button"
              aria-pressed={ingredients.length > 0}
              aria-haspopup="dialog"
              onClick={() => setSheet('ingredients')}
            >
              {ingredients.length === 0
                ? 'Ingredients'
                : ingredients.length === 1
                  ? capitalize(ingredients[0])
                  : `${ingredients.length} ingredients`}
            </button>
          </div>
        </div>

        <p className="dl-count" aria-live="polite">
          {found.length} {found.length === 1 ? 'drink' : 'drinks'}
        </p>

        {found.length > 0 ? (
          <ul className="dl-drinks">
            {found.map((drink) => (
              <li key={drink.drink.id}>
                <DrinkCard
                  found={drink}
                  photo={
                    isCustomDrinkId(drink.drink.id)
                      ? photos[drink.drink.id]
                      : drink.drink.photo && `${import.meta.env.BASE_URL}${drink.drink.photo}`
                  }
                  listSearch={params.toString()}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="dl-empty">
            <p>
              No drinks match{query.trim() ? ` "${query.trim()}"` : ''}
              {filters ? ' with these filters' : ''}. Try fewer words or another filter.
            </p>
            {filtered && (
              <button type="button" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                Clear search and filters
              </button>
            )}
          </div>
        )}
      </main>

      {sheet === 'tools' && (
        <ToolSheet
          choices={choices.tools}
          picked={tools}
          onChange={(next) => updateAll('tool', next)} onClose={() => setSheet(null)} />
      )}
      {sheet === 'ingredients' && (
        <IngredientSheet
          choices={choices.ingredients}
          picked={ingredients}
          onChange={(next) => updateAll('ing', next)} onClose={() => setSheet(null)} />
      )}
    </div>
  )
}

const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1)

// Tick the tools you have, and the list keeps the Drinks with a Riff you can
// make with them. A barspoon and a strainer aren't offered: any long spoon
// stirs, and a shaker's lid strains.
function ToolSheet({
  choices,
  picked,
  onChange,
  onClose,
}: {
  choices: Tool[]
  picked: Tool[]
  onChange: (tools: Tool[]) => void
  onClose: () => void
}) {
  const toggle = (tool: Tool) =>
    onChange(choices.filter((choice) => (choice === tool ? !picked.includes(tool) : picked.includes(choice))))
  return (
    <Sheet label="Tools you have" onClose={onClose}>
      <h2>Tools you have</h2>
      <p className="dl-sheet-note">
        Shows the drinks you can make with just these. Any long spoon works as a barspoon, and a shaker's lid as a
        strainer.
      </p>
      <div className="dl-sheet-chips" role="group" aria-label="Tools">
        {choices.map((tool) => (
          <button key={tool} type="button" aria-pressed={picked.includes(tool)} onClick={() => toggle(tool)}>
            {TOOL_NAMES[tool]}
          </button>
        ))}
      </div>
      {picked.length > 0 && (
        <button type="button" className="dl-sheet-clear" onClick={() => onChange([])}>
          Clear tools
        </button>
      )}
    </Sheet>
  )
}

// Pick ingredients to use up, and the list keeps the Drinks with a Riff that
// uses any of them. Picked ones stay at the top; the rest are grouped by
// kind, and a search narrows them.
function IngredientSheet({
  choices,
  picked,
  onChange,
  onClose,
}: {
  choices: string[]
  picked: string[]
  onChange: (ingredients: string[]) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const searchId = useId()
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const rest = choices.filter(
    (ingredient) => !picked.includes(ingredient) && words.every((word) => ingredient.includes(word)),
  )
  const toggle = (ingredient: string) =>
    onChange(picked.includes(ingredient) ? picked.filter((i) => i !== ingredient) : [...picked, ingredient])
  const chip = (ingredient: string) => (
    <button key={ingredient} type="button" aria-pressed={picked.includes(ingredient)} onClick={() => toggle(ingredient)}>
      {capitalize(ingredient)}
    </button>
  )
  return (
    <Sheet label="Ingredients" onClose={onClose}>
      <h2>Ingredients</h2>
      <p className="dl-sheet-note">Shows the drinks that use any of these, opened on a version with them.</p>
      {picked.length > 0 && (
        <div className="dl-sheet-chips" role="group" aria-label="Picked ingredients">
          {picked.map(chip)}
        </div>
      )}
      <div className="dl-search dl-sheet-search">
        <label htmlFor={searchId} className="dl-visually-hidden">
          Search ingredients
        </label>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
        <input
          id={searchId}
          type="search"
          placeholder="Search ingredients"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {rest.length > 0 ? (
        groupIngredients(rest).map(({ group, names }) => (
          <section key={group} className="dl-sheet-group" aria-label={group}>
            <h3>{group}</h3>
            <div className="dl-sheet-chips">{names.map(chip)}</div>
          </section>
        ))
      ) : (
        <p className="dl-sheet-note">No other ingredients match "{query.trim()}".</p>
      )}
      {picked.length > 0 && (
        <button type="button" className="dl-sheet-clear" onClick={() => onChange([])}>
          Clear ingredients
        </button>
      )}
    </Sheet>
  )
}

// Filter chips read in alphabetical order.
const byName = <T extends { name: string }>(choices: T[]) => [...choices].sort((a, b) => a.name.localeCompare(b.name))

// One row of toggle chips that scrolls sideways. Tapping the picked chip
// again clears the filter.
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
      <div className="dl-chips">
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
    </div>
  )
}

// A Drink as the Riff the search found, usually its House Spec: the photo,
// or the glass drawn in the Riff's colors when there's no photo or the Riff
// isn't the House Spec. A Riff that isn't says what it swaps. The name takes
// the first Slot's color, as it does on the Drink page. The list's search and
// filters travel along, so the Drink page's "All drinks" link returns to the
// same list.
function DrinkCard({
  found: { drink, picks },
  photo,
  listSearch,
}: {
  found: FoundDrink
  photo: string | undefined
  listSearch: string
}) {
  const riff = useMemo(() => resolveRiff(drink, picks), [drink, picks])
  const [photoFailed, setPhotoFailed] = useState(false)
  const firstColor = drink.slots[0].options.find((option) => option.id === riff.picks[drink.slots[0].id])?.color
  const swaps = drink.slots.flatMap((slot) => {
    const optionId = picks[slot.id]
    if (optionId === drink.houseSpec[slot.id]) return []
    if (optionId === null) return [`no ${slot.label.toLowerCase()}`]
    return slot.options.filter((option) => option.id === optionId).map((option) => option.label.toLowerCase())
  })

  return (
    <Link to={riffLink(drink, picks)} state={{ listSearch } satisfies ListState} className="dl-card">
      <span className="dl-card-art">
        {!photo || photoFailed || swaps.length > 0 ? (
          <GlassSketch glass={drink.glass} colors={riff.colors} className="dl-card-sketch" />
        ) : (
          <img src={photo} alt="" onError={() => setPhotoFailed(true)} />
        )}
      </span>
      <span className="dl-card-text">
        <span className="dl-card-name" style={firstColor ? { color: readable(firstColor, CARD) } : undefined}>
          {drink.name}
        </span>
        {isCustomDrinkId(drink.id) && <span className="dl-card-yours">Yours</span>}
        {swaps.length > 0 && <span className="dl-card-riff">With {swaps.join(', ')}</span>}
        <span className="dl-card-meta">
          {METHOD_NAMES[riff.method]}, {glassInSentence(GLASS_NAMES[drink.glass])}
        </span>
        <span className="dl-card-tags">{drink.flavorTags.join(', ')}</span>
      </span>
    </Link>
  )
}
