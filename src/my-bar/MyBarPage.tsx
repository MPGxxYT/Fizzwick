import { useId, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useDrinks } from '../custom-drinks/store'
import { TOOL_NAMES } from '../drink-page/format'
import { barTools, FROM_YOUR_DRINKS, ingredientChoices, searchDrinks } from '../house-drinks/search'
import type { Tool } from '../riff-engine'
import { BAR_GROUPS, BAR_ITEMS, namesOf } from './bar-items'
import { updateMyBar, useMyBar } from './use-my-bar'
import '../drink-list/drink-list.css'
import '../drink-page/drink-page.css'
import './my-bar-page.css'

interface Row {
  value: string
  label: string
  names: string[]
}

// Items with something a Drink needs. Garnish-only ones never stop you making
// a Drink, so there's nothing to tick.
const itemRows = (group: string): Row[] =>
  BAR_ITEMS.filter((item) => item.group === group && item.covers.length > 0)
    .map((item) => ({ value: item.id, label: item.label, names: namesOf(item) }))
    .sort((a, b) => a.label.localeCompare(b.label))

// What you have, saved on this device with each tick: tools, then ingredients
// in groups, with a count of the Drinks they let you make.
export function MyBarPage() {
  const { key } = useLocation()
  const navigate = useNavigate()
  const myBar = useMyBar()
  const { drinks } = useDrinks()
  const [query, setQuery] = useState('')
  const searchId = useId()

  const count = useMemo(() => searchDrinks(drinks, { myBar }).length, [drinks, myBar])
  const yours = useMemo(() => ingredientChoices(drinks).filter((choice) => choice.group === FROM_YOUR_DRINKS), [drinks])

  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const matches = ({ label, names }: Row) => {
    const text = [label.toLowerCase(), ...names].join(' \n ')
    return words.every((word) => text.includes(word))
  }
  const tools = barTools().filter((tool) => matches({ value: tool, label: TOOL_NAMES[tool], names: [] }))
  const groups = [
    ...BAR_GROUPS.map((group) => ({ group: group as string, rows: itemRows(group) })),
    { group: FROM_YOUR_DRINKS as string, rows: yours as Row[] },
  ]
    .map(({ group, rows }) => ({ group, rows: rows.filter(matches) }))
    .filter(({ rows }) => rows.length > 0)

  const toggleTool = (tool: Tool) =>
    updateMyBar({ tools: myBar.tools.includes(tool) ? myBar.tools.filter((t) => t !== tool) : [...myBar.tools, tool] })
  const toggleItem = (item: string) =>
    updateMyBar({ items: myBar.items.includes(item) ? myBar.items.filter((i) => i !== item) : [...myBar.items, item] })

  return (
    <div className="dp mb">
      <div className="dp-glow" aria-hidden="true" />
      <main className="dp-page">
        {/* Back where you came from, or to the list when opened directly. */}
        {key === 'default' ? (
          <Link to="/" className="dp-back">
            <BackArrow />
            All drinks
          </Link>
        ) : (
          <button type="button" className="dp-back mb-back" onClick={() => navigate(-1)}>
            <BackArrow />
            Back
          </button>
        )}

        <header className="dp-head">
          <h1>My Bar</h1>
          <p className="dp-kicker">Tick what you have. Saved on this device.</p>
        </header>

        <p className="mb-count" aria-live="polite">
          You can make {count} {count === 1 ? 'drink' : 'drinks'}
        </p>

        <div className="dl-search mb-search">
          <label htmlFor={searchId} className="dl-visually-hidden">
            Search My Bar
          </label>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4.5 4.5" />
          </svg>
          <input
            id={searchId}
            type="search"
            placeholder="Search tools and ingredients"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {tools.length > 0 && (
          <section className="dl-sheet-group" aria-label="Tools">
            <h3>Tools</h3>
            <div className="dl-sheet-chips">
              {tools.map((tool) => (
                <button key={tool} type="button" aria-pressed={myBar.tools.includes(tool)} onClick={() => toggleTool(tool)}>
                  {TOOL_NAMES[tool]}
                </button>
              ))}
            </div>
          </section>
        )}
        {groups.map(({ group, rows }) => (
          <section key={group} className="dl-sheet-group" aria-label={group}>
            <h3>{group}</h3>
            <div className="dl-sheet-chips">
              {rows.map((row) => (
                <button
                  key={row.value}
                  type="button"
                  aria-pressed={myBar.items.includes(row.value)}
                  onClick={() => toggleItem(row.value)}
                >
                  {row.label}
                </button>
              ))}
            </div>
          </section>
        ))}
        {tools.length === 0 && groups.length === 0 && (
          <p className="mb-empty">Nothing in My Bar matches "{query.trim()}".</p>
        )}
      </main>
    </div>
  )
}

function BackArrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}
