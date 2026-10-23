import { Fragment, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import type { BarTerm, Segment } from '../bar-terms'
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

// In a portal, since terms sit inside paragraphs and headings. React still
// passes the sheet's events up to the text around the term, so they stop
// here: a tap in the sheet must not also turn a page in step mode.
export function TermSheet({ term, linkToPage, onClose }: { term: BarTerm; linkToPage: boolean; onClose: () => void }) {
  return createPortal(
    <div onClick={stop} onPointerDown={stop} onPointerUp={stop}>
      <Sheet label={term.name} onClose={onClose}>
        <h2>{term.name}</h2>
        <p className="dp-term-definition">{term.definition}</p>
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
