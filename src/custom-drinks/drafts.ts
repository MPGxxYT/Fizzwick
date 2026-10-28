import type { Drink } from '../riff-engine'

// Unsaved edits, kept in memory while the editor and its Preview take turns
// on screen, so going to Preview and back loses nothing. A reload starts
// over from the saved Drink. `original` is what the editor opened with, to
// tell whether anything changed. `photo` is a new photo to save, null to
// remove the saved one, or undefined to leave it as it is.
export interface Draft {
  original: Drink
  draft: Drink
  isNew: boolean
  photo?: Blob | null
}

const drafts = new Map<string, Draft>()

export const getDraft = (id: string) => drafts.get(id)
export const setDraft = (entry: Draft) => void drafts.set(entry.original.id, entry)
export const dropDraft = (id: string) => void drafts.delete(id)

export const changed = ({ original, draft, photo }: Draft) =>
  photo !== undefined || JSON.stringify(original) !== JSON.stringify(draft)
