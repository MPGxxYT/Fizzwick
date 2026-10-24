import { describe, expect, it } from 'vitest'
import { markBarTerms, type Segment } from '.'

// "Muddle the [cherries|muddle]" style, to read results at a glance.
const show = (segments: Segment[]) =>
  segments.map((segment) => (segment.term ? `[${segment.text}|${segment.term.id}]` : segment.text)).join('')

const one = (text: string) => show(markBarTerms([text])[0])

describe('markBarTerms', () => {
  it('marks a Bar Term and leaves the rest of the text as it is', () => {
    expect(one('Stir gently with a barspoon.')).toBe('[Stir|stir] gently with a [barspoon|barspoon].')
  })

  it('finds plural and verb forms', () => {
    expect(one('Muddled fresh cherries')).toBe('[Muddled|muddle] fresh cherries')
    expect(one('2 dashes of bitters')).toBe('2 [dashes|dash] of [bitters|bitters]')
    expect(one('Keep stirring')).toBe('Keep [stirring|stir]')
    expect(one('Shaken over ice')).toBe('[Shaken|shake] over ice')
    expect(one('Expressed orange peel')).toBe('[Expressed|express] orange peel')
  })

  it('prefers the longest term, so a phrase wins over the word inside it', () => {
    expect(one('Dry shake: seal the tin')).toBe('[Dry shake|dry-shake]: seal the tin')
    expect(one('Fine strain the drink')).toBe('[Fine strain|fine-strain] the drink')
    expect(one('into a shaker tin')).toBe('into a [shaker tin|shaker]')
  })

  it('tells the syrups apart by their first word', () => {
    expect(one('Pour the blueberry syrup into a shaker tin.')).toBe('Pour the [blueberry syrup|blueberry-syrup] into a [shaker tin|shaker].')
    expect(one('Put the {milk}, cinnamon syrup, vanilla')).toBe('Put the {milk}, [cinnamon syrup|cinnamon-syrup], vanilla')
    expect(one('Simple syrup or honey syrup')).toBe('[Simple syrup|simple-syrup] or [honey syrup|honey-syrup]')
    expect(one('Maple syrup')).toBe('Maple syrup')
  })

  it('never matches inside a longer word', () => {
    expect(one('Use the muddler')).toBe('Use the [muddler|muddler]')
    expect(one('a fine strainer')).toBe('a [fine strainer|fine-strainer]')
    expect(one('Pour it in')).toBe('Pour it in')
  })

  it('takes Top as the measure, not the top of the glass', () => {
    expect(one('Top with soda water.')).toBe('[Top|top] with soda water.')
    expect(one('Float the pear slice on top.')).toBe('[Float|float] the pear slice on top.')
  })

  it('marks only the first occurrence of each term across a screen', () => {
    const screen = markBarTerms([
      'Fill the tin with ice and shake hard.',
      'Shake again with ice.',
      'Dry shake first, then shake.',
    ]).map(show)
    expect(screen).toEqual([
      'Fill the tin with ice and [shake|shake] hard.',
      'Shake again with ice.',
      '[Dry shake|dry-shake] first, then shake.',
    ])
  })

  it('returns one plain segment for text with no terms, and none for empty text', () => {
    expect(markBarTerms(['fresh lime juice', ''])).toEqual([[{ text: 'fresh lime juice' }], []])
  })
})
