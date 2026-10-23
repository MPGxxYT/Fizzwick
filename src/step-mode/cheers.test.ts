import { describe, expect, it } from 'vitest'
import { CHEERS, pickCheers } from './cheers'

describe('the finish phrase', () => {
  it('can be any of the phrases', () => {
    const picked = new Set(Array.from({ length: 40 }, (_, i) => pickCheers(null, i / 40)))
    expect([...picked].sort()).toEqual([...CHEERS].sort())
  })

  it('is never the one shown last time', () => {
    for (let i = 0; i < 40; i++) expect(pickCheers('Cheers!', i / 40)).not.toBe('Cheers!')
  })
})
