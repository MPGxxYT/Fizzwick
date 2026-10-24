import { describe, expect, it } from 'vitest'
import { BAR_TERMS } from '.'

const PREPPED = {
  'How to make it': [
    'simple-syrup',
    'demerara-syrup',
    'honey-syrup',
    'blueberry-syrup',
    'cherry-syrup',
    'chai-syrup',
    'cinnamon-syrup',
    'ginger-syrup',
    'lavender-syrup',
  ],
  'How to cut it': ['wheel', 'wedge'],
  'How to do it': ['express'],
}

describe('Bar Terms', () => {
  it('have unique IDs', () => {
    const ids = BAR_TERMS.map((term) => term.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('give prep steps for the things you get ready before a Drink, and only those', () => {
    const prepped = Object.fromEntries(
      Object.keys(PREPPED).map((heading) => [
        heading,
        BAR_TERMS.filter((term) => term.prep?.heading === heading).map((term) => term.id),
      ]),
    )
    expect(prepped).toEqual(PREPPED)
  })

  it('keep prep to a few short steps', () => {
    for (const term of BAR_TERMS.filter((term) => term.prep)) {
      expect(term.prep!.steps.length, term.id).toBeGreaterThanOrEqual(3)
      expect(term.prep!.steps.length, term.id).toBeLessThanOrEqual(6)
      for (const step of term.prep!.steps) expect(step, term.id).toMatch(/^[A-Z].*\.$/)
    }
  })
})
