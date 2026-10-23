import { BAR_TERMS, type BarTerm } from './terms'

export interface Segment {
  text: string
  term?: BarTerm
}

// Splits each text on a screen into plain and Bar Term segments. A term is
// marked only the first time it appears across all the texts, in order. Where
// matches overlap, the one that starts first wins, then the longest, so
// "dry shake" is one term rather than "shake" inside it.
export function markBarTerms(texts: string[]): Segment[][] {
  const seen = new Set<string>()
  return texts.map((text) => {
    const segments: Segment[] = []
    const plain = (piece: string) => {
      if (!piece) return
      const previous = segments.at(-1)
      if (previous && !previous.term) previous.text += piece
      else segments.push({ text: piece })
    }
    let at = 0
    for (const match of findMatches(text)) {
      plain(text.slice(at, match.start))
      const piece = text.slice(match.start, match.end)
      if (seen.has(match.term.id)) plain(piece)
      else {
        seen.add(match.term.id)
        segments.push({ text: piece, term: match.term })
      }
      at = match.end
    }
    plain(text.slice(at))
    return segments
  })
}

interface Match {
  start: number
  end: number
  term: BarTerm
}

function findMatches(text: string): Match[] {
  const all: Match[] = []
  for (const { term, pattern } of MATCHERS) {
    for (const found of text.matchAll(pattern)) {
      all.push({ start: found.index, end: found.index + found[0].length, term })
    }
  }
  all.sort((a, b) => a.start - b.start || b.end - a.end)
  const kept: Match[] = []
  for (const match of all) {
    if (match.start >= (kept.at(-1)?.end ?? 0)) kept.push(match)
  }
  return kept
}

// One pattern per term, matching any of its forms as whole words.
const MATCHERS = BAR_TERMS.map((term) => {
  const phrases = (term.forms ?? [term.name]).flatMap(phraseForms)
  const alternatives = [...new Set(phrases)]
    .sort((a, b) => b.length - a.length)
    .map((phrase) => phrase.split(' ').map(escape).join('[\\s-]+'))
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives.join('|')})(?![\\p{L}\\p{N}])`, term.caseSensitive ? 'gu' : 'giu')
  return { term, pattern }
})

// "fine strain" -> "fine strain", "fine strains", "fine strained", ...
function phraseForms(phrase: string): string[] {
  const words = phrase.split(' ')
  const last = words.pop()!
  return wordForms(last).map((form) => [...words, form].join(' '))
}

// Simple English plurals and verb forms: muddle -> muddles, muddled,
// muddling; dash -> dashes, dashed; stir -> stirs, stirred, stirring.
function wordForms(word: string): string[] {
  if (/e$/i.test(word)) return [word, `${word}s`, `${word}d`, `${word.slice(0, -1)}ing`]
  const forms = [word, /(s|sh|ch|x|z)$/i.test(word) ? `${word}es` : `${word}s`, `${word}ed`, `${word}ing`]
  // A short word ending consonant-vowel-consonant doubles its last letter.
  if (word.length <= 4 && /[^aeiou][aeiou][^aeiouwxy]$/i.test(word)) {
    const doubled = word + word.at(-1)
    forms.push(`${doubled}ed`, `${doubled}ing`)
  }
  return forms
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
