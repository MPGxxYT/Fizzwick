import { describe, expect, test } from 'vitest'
import { coverCrop, PHOTO_HEIGHT, PHOTO_WIDTH } from './photo'

describe('coverCrop', () => {
  test('crops a wide photo from the centre to the card shape', () => {
    // 4000 by 3000 is wider than the 510 by 600 card, so the sides go.
    const crop = coverCrop(4000, 3000)
    expect(crop.height).toBe(3000)
    expect(crop.width).toBeCloseTo(3000 * (PHOTO_WIDTH / PHOTO_HEIGHT))
    expect(crop.x).toBeCloseTo((4000 - crop.width) / 2)
    expect(crop.y).toBe(0)
  })

  test('crops a tall photo from the centre to the card shape', () => {
    const crop = coverCrop(1000, 4000)
    expect(crop.width).toBe(1000)
    expect(crop.height).toBeCloseTo(1000 * (PHOTO_HEIGHT / PHOTO_WIDTH))
    expect(crop.x).toBe(0)
    expect(crop.y).toBeCloseTo((4000 - crop.height) / 2)
  })

  test('keeps a photo already the card shape whole', () => {
    expect(coverCrop(PHOTO_WIDTH * 2, PHOTO_HEIGHT * 2)).toEqual({
      x: 0,
      y: 0,
      width: PHOTO_WIDTH * 2,
      height: PHOTO_HEIGHT * 2,
    })
  })
})
