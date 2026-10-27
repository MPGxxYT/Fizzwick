import type { Drink } from '../riff-engine'

// Unsaved edits, kept in memory while the editor and its Preview take turns
// on screen, so going to Preview and back loses nothing. A reload starts
// over from the saved Drink. `original` is what the editor opened with, to
// tell whether anything changed.
export interface Draft {
  original: Drink
  draft: Drink
  isNew: boolean
}

const drafts = new Map<string, Draft>()

export const getDraft = (id: string) => drafts.get(id)
export const setDraft = (entry: Draft) => void drafts.set(entry.original.id, entry)
export const dropDraft = (id: string) => void drafts.delete(id)

export const changed = ({ original, draft }: Draft) => JSON.stringify(original) !== JSON.stringify(draft)
