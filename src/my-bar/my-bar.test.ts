import { describe, expect, test } from 'vitest'
import { EMPTY_MY_BAR, readMyBar } from './my-bar'

describe('readMyBar', () => {
  test('starts empty', () => {
    expect(readMyBar(null)).toEqual(EMPTY_MY_BAR)
  })

  test('reads what was saved', () => {
    const saved = { tools: ['jigger'], items: ['lemons', 'charred lemon wheel'] }
    expect(readMyBar(JSON.stringify(saved))).toEqual(saved)
  })

  test('leaves out what it cannot read', () => {
    expect(readMyBar('not json')).toEqual(EMPTY_MY_BAR)
    expect(readMyBar('[]')).toEqual(EMPTY_MY_BAR)
    expect(readMyBar(JSON.stringify({ tools: ['jigger', 'spork'], items: ['lemons', 3] }))).toEqual({
      tools: ['jigger'],
      items: ['lemons'],
    })
    expect(readMyBar(JSON.stringify({ tools: 'jigger' }))).toEqual(EMPTY_MY_BAR)
  })
})
