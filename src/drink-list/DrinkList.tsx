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
  groupChoices,
  ingredientChoices,
  ingredientLabel,
  searchDrinks,
  toolChoices,
  type FoundDrink,
  type IngredientChoice,
} from '../house-drinks/search'
import { isMyBarEmpty } from '../my-bar/my-bar'
import { useCanMakeBar, useMyBar } from '../my-bar/use-my-bar'
import { FLAVOR_TAGS, METHODS, resolveRiff, riffLink, TOOLS, type FlavorTag, type Method, type Tool } from '../riff-engine'
import { updateSettings } from '../settings/use-settings'
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

// The app's other pages, in a sheet where a thumb can reach them.
function MainMenu({ onClose }: { onClose: () => void }) {
  return (
    <Sheet label="Menu" onClose={onClose}>
      <h2>Menu</h2>
      <nav className="dl-menu-links" aria-label="Menu">
        <Link to="/my-bar">My Bar</Link>
        <Link to="/new">New drink</Link>
        <Link to="/bar-terms">Bar Terms</Link>
        <Link to="/settings">Settings</Link>
      </nav>
    </Sheet>
  )
}

// Home: every Drink, with search by name or ingredient and filters by Method,
// Flavor Tag, the tools you have and the ingredients you want to use. The
// search and filters live in the address, so coming back from a Drink shows
// the same list. Can make stays out of it, so a shared link never carries it,
// and it stays on until you turn it off.
export function DrinkList() {
  const [params, setParams] = useSearchParams()
  const [menuOpen, setMenuOpen] = useState(false)
  const { drinks, photos } = useDrinks()
  const barEmpty = isMyBarEmpty(useMyBar())
  const canMakeBar = useCanMakeBar()
  const canMake = canMakeBar !== undefined
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
        myBar: canMakeBar,
      }),
    [drinks, yours, query, method, flavor, ingredients, tools, canMakeBar],
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
      {menuOpen && <MainMenu onClose={() => setMenuOpen(false)} />}
      <div className="dp-glow" aria-hidden="true" />
      <Bubbles />
      <main className="dl-page">
        <Link to="/favorites" className="dl-favorites" aria-label="Favorites">
          <Heart />
        </Link>
        <button
          type="button"
          className="dl-menu"
          aria-label="Menu"
          aria-haspopup="dialog"
          onClick={() => setMenuOpen(true)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
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
            {barEmpty ? (
              <Link to="/my-bar" className="dl-bar-link">
                Set up My Bar
              </Link>
            ) : (
              <button type="button" aria-pressed={canMake} onClick={() => updateSettings({ canMake: !canMake })}>
                Can make
              </button>
            )}
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
                  ? ingredientLabel(ingredients[0])
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
            {filtered ? (
              <p>
                No drinks match{query.trim() ? ` "${query.trim()}"` : ''}
                {filters ? ' with these filters' : ''}
                {canMake ? ' from My Bar' : ''}. Try fewer words or another filter.
              </p>
            ) : (
              <p>My Bar doesn't make a drink yet. Tick a few more things.</p>
            )}
            {filtered && (
              <button type="button" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                Clear search and filters
              </button>
            )}
            {canMake && (
              <Link to="/my-bar" className="dl-empty-bar">
                Open My Bar
              </Link>
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

// Tick the tools you have, and the list keeps the Drinks with a Riff you can
// make with them. Tools a kitchen has a stand-in for aren't offered.
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
        Shows the drinks you can make with just these. Your kitchen covers the rest: a long spoon stirs, a shaker's lid
        strains, a pot boils water, a knife peels, and a pint glass works as a mixing glass.
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
  choices: IngredientChoice[]
  picked: string[]
  onChange: (ingredients: string[]) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const searchId = useId()
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const rest = choices.filter((choice) => {
    const text = [choice.label.toLowerCase(), ...choice.names].join(' \n ')
    return !picked.includes(choice.value) && words.every((word) => text.includes(word))
  })
  const toggle = (value: string) =>
    onChange(picked.includes(value) ? picked.filter((i) => i !== value) : [...picked, value])
  const chip = (value: string) => (
    <button key={value} type="button" aria-pressed={picked.includes(value)} onClick={() => toggle(value)}>
      {ingredientLabel(value)}
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
        groupChoices(rest).map(({ group, choices }) => (
          <section key={group} className="dl-sheet-group" aria-label={group}>
            <h3>{group}</h3>
            <div className="dl-sheet-chips">{choices.map((choice) => chip(choice.value))}</div>
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
