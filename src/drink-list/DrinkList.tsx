import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
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
  toolChoices,
  type FoundDrink,
  type IngredientChoice,
} from '../house-drinks/search'
import { isMyBarEmpty } from '../my-bar/my-bar'
import { useCanMakeBar, useMyBar } from '../my-bar/use-my-bar'
import { resolveRiff, riffLink, type FlavorTag, type Method, type Tool } from '../riff-engine'
import { updateSettings } from '../settings/use-settings'
import { findInList, readListFilters, useSurprise } from './list-search'
import { groupByShelf, newDrinkIds } from './shelves'
import './drink-list.css'

// The Shelf's ground, so the Drink names on it stay readable.
const CARD = '#2e2049'

// Passed to a Drink page so its "All drinks" link can return to this list.
export interface ListState {
  listSearch: string
}

const flavorName = (flavor: FlavorTag) => flavor[0].toUpperCase() + flavor.slice(1)

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

// Home: every Drink, grouped on Shelves, with search by name or ingredient
// and filters by Method, Flavor Tag, the tools you have and the ingredients
// you want to use. The filters wait in a sheet, and the ones that are on show
// as chips under the search. The search and filters live in the address, so
// coming back from a Drink shows the same list. Can make stays out of it, so
// a shared link never carries it, and it stays on until you turn it off.
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
  const fresh = useMemo(() => newDrinkIds(drinks), [drinks])
  // Read from a string so the filters only change when the address does.
  const listSearch = params.toString()
  const listFilters = useMemo(() => readListFilters(new URLSearchParams(listSearch)), [listSearch])
  const { yours, query, method, flavor, tools, ingredients } = listFilters
  const found = useMemo(() => findInList(drinks, listFilters, canMakeBar), [drinks, listFilters, canMakeBar])
  const shelves = useMemo(() => groupByShelf(found, (item) => item.drink), [found])
  const surprise = useSurprise(listSearch)
  const [sheet, setSheet] = useState<'filters' | 'tools' | 'ingredients' | null>(null)

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

  // The filters that are on, each as a chip that turns it off.
  const onChips = [
    ...(yours ? [{ key: 'yours', name: 'Yours', off: () => update('yours', undefined) }] : []),
    ...(canMake ? [{ key: 'can-make', name: 'Can make', off: () => updateSettings({ canMake: false }) }] : []),
    ...(method ? [{ key: 'method', name: METHOD_NAMES[method], off: () => update('method', undefined) }] : []),
    ...(flavor ? [{ key: 'flavor', name: flavorName(flavor), off: () => update('flavor', undefined) }] : []),
    ...(tools.length > 0
      ? [
          {
            key: 'tools',
            name: tools.length === 1 ? TOOL_NAMES[tools[0]] : `${tools.length} tools`,
            off: () => updateAll('tool', []),
          },
        ]
      : []),
    ...ingredients.map((value) => ({
      key: `ing-${value}`,
      name: ingredientLabel(value),
      off: () => updateAll('ing', ingredients.filter((other) => other !== value)),
    })),
  ]
  const filters = Boolean(yours || method || flavor || tools.length > 0 || ingredients.length > 0)
  const filtered = Boolean(query.trim()) || filters
  const searchId = useId()

  return (
    <div className="dl">
      {menuOpen && <MainMenu onClose={() => setMenuOpen(false)} />}
      <div className="dp-glow" aria-hidden="true" />
      <Bubbles />
      <main className="dl-page">
        <header className="dl-head">
          <Link to="/favorites" className="dl-icon-button" aria-label="Favorites">
            <Heart />
          </Link>
          <h1>{APP_NAME}</h1>
          <button
            type="button"
            className="dl-icon-button"
            aria-label="Menu"
            aria-haspopup="dialog"
            onClick={() => setMenuOpen(true)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </header>

        <div className="dl-find">
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
              placeholder="Search drinks"
              value={query}
              onChange={(event) => update('q', event.target.value || undefined)}
            />
          </div>
          <button
            type="button"
            className="dl-filters-button"
            aria-haspopup="dialog"
            aria-label={onChips.length > 0 ? `Filters, ${onChips.length} on` : 'Filters'}
            onClick={() => setSheet('filters')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
              <circle cx="16" cy="7" r="2" />
              <circle cx="8" cy="17" r="2" />
            </svg>
            Filters
            {onChips.length > 0 && <span className="dl-filters-count">{onChips.length}</span>}
          </button>
        </div>

        {onChips.length > 0 && (
          <div className="dl-on" role="group" aria-label="Filters on">
            {onChips.map((chip) => (
              <button key={chip.key} type="button" aria-label={`Turn off ${chip.name}`} onClick={chip.off}>
                {chip.name}
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 7l10 10M17 7L7 17" />
                </svg>
              </button>
            ))}
          </div>
        )}

        <div className="dl-count-line">
          <p className="dl-count" aria-live="polite">
            {found.length} {found.length === 1 ? 'drink' : 'drinks'}
          </p>
          <span aria-hidden="true">·</span>
          <button type="button" className="dl-surprise" disabled={found.length === 0} onClick={() => surprise()}>
            Surprise me
          </button>
        </div>

        {found.length > 0 ? (
          <>
            {shelves.length > 1 && <ShelfNav shelves={shelves.map(({ shelf, name }) => ({ shelf, name }))} />}
            {shelves.map(({ shelf, name, items }) => (
              <section key={shelf} id={`shelf-${shelf}`} className="dl-shelf" aria-labelledby={`shelf-${shelf}-name`}>
                <h2 id={`shelf-${shelf}-name`}>{name}</h2>
                <ul className="dl-drinks">
                  {items.map((drink) => (
                    <li key={drink.drink.id}>
                      <DrinkRow
                        found={drink}
                        photo={
                          isCustomDrinkId(drink.drink.id)
                            ? photos[drink.drink.id]
                            : drink.drink.photo && `${import.meta.env.BASE_URL}${drink.drink.photo}`
                        }
                        isNew={fresh.has(drink.drink.id)}
                        listSearch={listSearch}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
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

      {sheet === 'filters' && (
        <Sheet label="Filters" onClose={() => setSheet(null)}>
          <h2>Filters</h2>
          <p className="dl-sheet-note" aria-live="polite">
            {found.length} {found.length === 1 ? 'drink' : 'drinks'} match.
          </p>
          {hasCustom && (
            <FilterGroup label="Show">
              <button type="button" aria-pressed={yours} onClick={() => update('yours', yours ? undefined : '1')}>
                Yours
              </button>
            </FilterGroup>
          )}
          <FilterGroup label="What you have">
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
          </FilterGroup>
          <FilterChoices
            label="Flavor"
            choices={byName(choices.flavors.map((value) => ({ value, name: flavorName(value) })))}
            picked={flavor}
            onPick={(value) => update('flavor', value)}
          />
          <FilterChoices<Method>
            label="Method"
            choices={byName(choices.methods.map((value) => ({ value, name: METHOD_NAMES[value] })))}
            picked={method}
            onPick={(value) => update('method', value)}
          />
          {filters && (
            <button
              type="button"
              className="dl-sheet-clear"
              onClick={() => setParams(query ? new URLSearchParams({ q: query }) : new URLSearchParams(), { replace: true })}
            >
              Clear filters
            </button>
          )}
        </Sheet>
      )}
      {/* Tools and Ingredients open from the Filters sheet and go back to it. */}
      {sheet === 'tools' && (
        <ToolSheet
          choices={choices.tools}
          picked={tools}
          onChange={(next) => updateAll('tool', next)}
          onClose={() => setSheet('filters')}
        />
      )}
      {sheet === 'ingredients' && (
        <IngredientSheet
          choices={choices.ingredients}
          picked={ingredients}
          onChange={(next) => updateAll('ing', next)}
          onClose={() => setSheet('filters')}
        />
      )}
    </div>
  )
}

// The Shelves' names in a strip that stays at the top while the list
// scrolls. Tapping one scrolls to that Shelf, and the Shelf on screen is
// marked.
function ShelfNav({ shelves }: { shelves: { shelf: string; name: string }[] }) {
  const nav = useRef<HTMLElement>(null)
  const [current, setCurrent] = useState(shelves[0].shelf)
  const key = shelves.map(({ shelf }) => shelf).join(' ')

  useEffect(() => {
    const onScroll = () => {
      const below = (nav.current?.getBoundingClientRect().bottom ?? 0) + 8
      const shelves = key.split(' ')
      let on = shelves[0]
      for (const shelf of shelves) {
        const top = document.getElementById(`shelf-${shelf}`)?.getBoundingClientRect().top
        if (top !== undefined && top <= below) on = shelf
      }
      // A short last Shelf never reaches the top, so at the bottom it's the one.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      setCurrent(atBottom && window.scrollY > 0 ? shelves[shelves.length - 1] : on)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [key])

  // Keep the marked name in view in the strip.
  useEffect(() => {
    const button = nav.current?.querySelector<HTMLElement>(`[data-shelf="${current}"]`)
    const strip = nav.current?.firstElementChild
    if (!button || !strip) return
    strip.scrollTo({ left: button.offsetLeft - 16, behavior: 'smooth' })
  }, [current])

  const jump = (shelf: string) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(`shelf-${shelf}`)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <nav ref={nav} className="dl-shelf-nav" aria-label="Shelves">
      <div className="dl-shelf-strip">
        {shelves.map(({ shelf, name }) => (
          <button
            key={shelf}
            type="button"
            data-shelf={shelf}
            aria-current={current === shelf ? 'true' : undefined}
            onClick={() => jump(shelf)}
          >
            {name}
          </button>
        ))}
      </div>
    </nav>
  )
}

// One labelled set of chips in the Filters sheet.
function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="dl-filter" role="group" aria-label={label}>
      <h3>{label}</h3>
      <div className="dl-sheet-chips">{children}</div>
    </section>
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

// One filter's chips, where only one can be on. Tapping the picked chip
// again clears the filter.
function FilterChoices<T extends string>({
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
    <FilterGroup label={label}>
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
    </FilterGroup>
  )
}

// A Drink as the Riff the search found, usually its House Spec: the photo,
// or the glass drawn in the Riff's colors when there's no photo or the Riff
// isn't the House Spec. A Riff that isn't says what it swaps. The name takes
// the first Slot's color, as it does on the Drink page. The list's search and
// filters travel along, so the Drink page's "All drinks" link returns to the
// same list.
function DrinkRow({
  found: { drink, picks },
  photo,
  isNew,
  listSearch,
}: {
  found: FoundDrink
  photo: string | undefined
  isNew: boolean
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
    <Link to={riffLink(drink, picks)} state={{ listSearch } satisfies ListState} className="dl-row">
      <span className="dl-row-art">
        {!photo || photoFailed || swaps.length > 0 ? (
          <GlassSketch glass={drink.glass} colors={riff.colors} className="dl-row-sketch" />
        ) : (
          <img src={photo} alt="" onError={() => setPhotoFailed(true)} />
        )}
      </span>
      <span className="dl-row-text">
        <span className="dl-row-title">
          <span className="dl-row-name" style={firstColor ? { color: readable(firstColor, CARD) } : undefined}>
            {drink.name}
          </span>
          {isNew && <span className="dl-row-mark is-new">New</span>}
          {drink.occasion === 'holiday' && <span className="dl-row-mark is-holiday">Holiday</span>}
          {isCustomDrinkId(drink.id) && <span className="dl-row-mark">Yours</span>}
        </span>
        {swaps.length > 0 && <span className="dl-row-riff">With {swaps.join(', ')}</span>}
        <span className="dl-row-meta">
          {METHOD_NAMES[riff.method]}, {glassInSentence(GLASS_NAMES[drink.glass])}
        </span>
        <span className="dl-row-tags">{drink.flavorTags.join(', ')}</span>
      </span>
      <svg className="dl-row-go" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}
