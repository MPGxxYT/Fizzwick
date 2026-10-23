import { describe, expect, it } from 'vitest'
import type { Segment } from '../bar-terms'
import { splitTimedPart, timedPart } from './timed-part'

const part = (text: string) => {
  const range = timedPart(text)
  return range && text.slice(range.start, range.end)
}

describe('the part of a step its timer is for', () => {
  it('runs from the timed action to the end of its clause', () => {
    expect(part('Fill the tin with ice and shake hard.')).toBe('shake hard')
    expect(part('Fill the tin with ice and shake hard until the tin feels frosty.')).toBe(
      'shake hard until the tin feels frosty',
    )
    expect(part('Fill the tin with ice and shake hard, so the milk turns light and foamy.')).toBe('shake hard')
    expect(part('Blend until smooth and frothy, then pour into a rocks glass.')).toBe('Blend until smooth and frothy')
    expect(part('Fill the mixing glass with ice and stir smoothly with a barspoon until the outside of the glass is cold.')).toBe(
      'stir smoothly with a barspoon until the outside of the glass is cold',
    )
    expect(part('Steep the black tea strong in just-boiled water, using twice the usual amount of tea, then strain it.')).toBe(
      'Steep the black tea strong in just-boiled water',
    )
  })

  it('takes the action that is described, not the name in front of a colon', () => {
    expect(part('Dry shake: seal the tin and shake hard without ice to whip up the foam.')).toBe(
      'shake hard without ice to whip up the foam',
    )
  })

  it('finds nothing when no timed action is named', () => {
    expect(timedPart('Fill a highball glass with fresh ice.')).toBeNull()
  })
})

describe('splitting marked text around the timed part', () => {
  const shake = { id: 'shake', name: 'Shake', definition: 'Shake it.' } as Segment['term']

  it('cuts plain text at the edges and keeps Bar Terms whole', () => {
    const segments: Segment[] = [{ text: 'Fill the tin with ice and ' }, { text: 'shake', term: shake }, { text: ' hard.' }]
    const { before, timed, after } = splitTimedPart(segments, { start: 26, end: 36 })
    expect(before).toEqual([{ text: 'Fill the tin with ice and ' }])
    expect(timed).toEqual([{ text: 'shake', term: shake }, { text: ' hard' }])
    expect(after).toEqual([{ text: '.' }])
  })

  it('pulls a Bar Term that crosses an edge fully inside', () => {
    const segments: Segment[] = [{ text: 'Then ' }, { text: 'shake', term: shake }, { text: ' well' }]
    const { before, timed } = splitTimedPart(segments, { start: 7, end: 15 })
    expect(before).toEqual([{ text: 'Then ' }])
    expect(timed[0]).toEqual({ text: 'shake', term: shake })
  })
})
