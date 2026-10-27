import { Fragment, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { markBarTerms, type BarTerm, type Segment } from '../bar-terms'
import { houseDrinks } from '../house-drinks/catalog'
import { ingredientChoices } from '../house-drinks/search'
import { useSettings } from '../settings/use-settings'
import { Sheet } from './Sheet'

// Text with its Bar Terms underlined, unless the underlines are turned off in
// Settings. Tapping one opens its definition either way.
// Step mode leaves out the link to the Bar Terms page, so a tap can't lose
// your place.
export function TermText({ segments, linkToPage = true }: { segments: Segment[]; linkToPage?: boolean }) {
  const [open, setOpen] = useState<BarTerm | null>(null)
  const { underlines } = useSettings()
  return (
    <>
      {segments.map((segment, i) =>
        segment.term ? (
          <button key={i} type="button" className={underlines ? 'dp-term' : 'dp-term is-plain'} onClick={() => setOpen(segment.term!)}>
            {segment.text}
          </button>
        ) : (
          <Fragment key={i}>{segment.text}</Fragment>
        ),
      )}
      {open && <TermSheet term={open} linkToPage={linkToPage} onClose={() => setOpen(null)} />}
    </>
  )
}

const stop = (event: React.SyntheticEvent) => event.stopPropagation()

// The ingredient names a Bar Term with Prep appears in, so its sheet can
// list the Drinks that use what you made: raspberry syrup, a lime wheel.
function ingredientsNaming(term: BarTerm): string[] {
  if (term.kind !== 'ingredient' || !term.prep) return []
  return ingredientChoices(houseDrinks).filter((name) =>
    markBarTerms([name])[0].some((segment) => segment.term?.id === term.id),
  )
}

// In a portal, since terms sit inside paragraphs and headings. React still
// passes the sheet's events up to the text around the term, so they stop
// here: a tap in the sheet must not also turn a page in step mode, which is
// why step mode leaves out both links.
export function TermSheet({
  term,
  linkToPage,
  linkToDrinks = linkToPage,
  onClose,
}: {
  term: BarTerm
  linkToPage: boolean
  linkToDrinks?: boolean
  onClose: () => void
}) {
  const ingredients = linkToDrinks ? ingredientsNaming(term) : []
  const drinksLink = `/?${new URLSearchParams(ingredients.map((name) => ['ing', name]))}`
  return createPortal(
    <div onClick={stop} onPointerDown={stop} onPointerUp={stop}>
      <Sheet label={term.name} onClose={onClose}>
        <h2>{term.name}</h2>
        <p className="dp-term-definition">{term.definition}</p>
        {term.prep && (
          <>
            <h3 className="dp-term-prep">{term.prep.heading}</h3>
            <ol className="dp-steps dp-term-steps" aria-label={term.prep.heading}>
              {term.prep.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </>
        )}
        {ingredients.length > 0 && (
          <Link to={drinksLink} className="dp-term-all">
            Drinks that use it
          </Link>
        )}
        {linkToPage && (
          <Link to={`/bar-terms#${term.id}`} className="dp-term-all">
            All Bar Terms
          </Link>
        )}
      </Sheet>
    </div>,
    document.body,
  )
}
