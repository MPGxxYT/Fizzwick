import { useId, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { BAR_TERM_KINDS, BAR_TERMS, markBarTerms, type BarTerm, type BarTermKind } from '../bar-terms'
import { TermSheet } from '../drink-page/TermText'
import '../drink-list/drink-list.css'
import '../drink-page/drink-page.css'
import './bar-terms-page.css'

const KIND_HEADINGS: Record<BarTermKind, string> = {
  method: 'Methods',
  technique: 'Techniques',
  measure: 'Measures',
  tool: 'Tools',
  glass: 'Glasses',
  ingredient: 'Ingredients and garnishes',
}

// A term matches a search when its name or definition contains the words,
// or when the search is one of its forms ("muddled" finds Muddle).
function searchTerms(query: string): BarTerm[] {
  const words = query.trim().toLowerCase()
  if (!words) return BAR_TERMS
  const named = new Set(markBarTerms([query])[0].flatMap((segment) => segment.term?.id ?? []))
  return BAR_TERMS.filter(
    (term) => named.has(term.id) || `${term.name} ${term.definition}`.toLowerCase().includes(words),
  )
}

// Every Bar Term as a chip, grouped by kind, with a search. Tapping a chip
// opens its definition. A link from a term's sheet elsewhere
// (/bar-terms#muddle) opens that term straight away.
export function BarTermsPage() {
  const { hash, key } = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(() => BAR_TERMS.find((term) => term.id === decodeURIComponent(hash.slice(1))) ?? null)
  const searchId = useId()
  const found = searchTerms(query)

  return (
    <div className="dp bt">
      <div className="dp-glow" aria-hidden="true" />
      <main className="dp-page">
        {/* Back where you came from, or to the list when opened directly. */}
        {key === 'default' ? (
          <Link to="/" className="dp-back">
            <BackArrow />
            All drinks
          </Link>
        ) : (
          <button type="button" className="dp-back bt-back" onClick={() => navigate(-1)}>
            <BackArrow />
            Back
          </button>
        )}

        <header className="dp-head">
          <h1>Bar Terms</h1>
          <p className="dp-kicker">The bartending words in Fizzwick drinks. Tap one to see what it means.</p>
        </header>

        <div className="dl-search bt-search">
          <label htmlFor={searchId} className="bt-visually-hidden">
            Search Bar Terms
          </label>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4.5 4.5" />
          </svg>
          <input
            id={searchId}
            type="search"
            placeholder="Search Bar Terms"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {found.length > 0 ? (
          BAR_TERM_KINDS.map((kind) => {
            const terms = found
              .filter((term) => term.kind === kind)
              .sort((a, b) => a.name.localeCompare(b.name))
            if (terms.length === 0) return null
            return (
              <section key={kind} className="bt-group" data-kind={kind} aria-labelledby={`bt-${kind}`}>
                <h2 id={`bt-${kind}`}>{KIND_HEADINGS[kind]}</h2>
                <ul>
                  {terms.map((term) => (
                    <li key={term.id}>
                      <button type="button" onClick={() => setOpen(term)}>
                        {term.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })
        ) : (
          <div className="bt-empty">
            <p>No Bar Terms match "{query.trim()}".</p>
            <button type="button" onClick={() => setQuery('')}>
              Clear search
            </button>
          </div>
        )}
      </main>

      {open && <TermSheet term={open} linkToPage={false} linkToDrinks onClose={() => setOpen(null)} />}
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
