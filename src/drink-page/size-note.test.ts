import { expect, test } from 'vitest'
import { sipLine, sizeNote } from './format'

test('sizeNote', () => {
  expect(sizeNote({ name: 'mint leaves', amount: 6, unit: 'count', size: { each: 'thumbnail-size' } })).toBe(
    'Each about thumbnail-size.',
  )
  expect(sizeNote({ name: 'lime wheel', amount: 1, unit: 'count' })).toBeUndefined()
})

test('sipLine', () => {
  expect(sipLine({ by: 'rim', why: 'so you smell the mint.' })).toBe('Sip it from the rim, so you smell the mint.')
  expect(sipLine({ by: 'straw', why: 'since it is thick.' })).toBe('Sip it through a straw, since it is thick.')
})
