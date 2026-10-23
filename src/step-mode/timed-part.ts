import type { Segment } from '../bar-terms'

export interface Range {
  start: number
  end: number
}

// The actions a step timer can be for. Each runs to the end of its clause.
const TIMED_ACTION = /\b(steep|stir|shake|blend)\b[^,.:;]*/gi

// Where in a timed step's text the timed action is, such as "shake hard until
// the tin feels frosty", so step mode can tie it to the timer. When the text
// names more than one, the longest clause wins: in "Dry shake: seal the tin
// and shake hard without ice", the name before the colon is not the action.
export function timedPart(text: string): Range | null {
  let best: Range | null = null
  for (const match of text.matchAll(TIMED_ACTION)) {
    const clause = match[0].trimEnd()
    if (!best || clause.length > best.end - best.start) best = { start: match.index, end: match.index + clause.length }
  }
  return best
}

// Splits Bar Term marked text into what comes before, inside and after a
// range. Plain text is cut at the edges; a Bar Term that crosses an edge goes
// inside whole, so it stays one tappable word.
export function splitTimedPart(segments: Segment[], range: Range) {
  const before: Segment[] = []
  const timed: Segment[] = []
  const after: Segment[] = []
  let at = 0
  for (const segment of segments) {
    const start = at
    const end = at + segment.text.length
    at = end
    if (end <= range.start) before.push(segment)
    else if (start >= range.end) after.push(segment)
    else if (segment.term) timed.push(segment)
    else {
      const cutFrom = Math.max(range.start, start) - start
      const cutTo = Math.min(range.end, end) - start
      if (cutFrom > 0) before.push({ text: segment.text.slice(0, cutFrom) })
      timed.push({ text: segment.text.slice(cutFrom, cutTo) })
      if (cutTo < segment.text.length) after.push({ text: segment.text.slice(cutTo) })
    }
  }
  return { before, timed, after }
}
