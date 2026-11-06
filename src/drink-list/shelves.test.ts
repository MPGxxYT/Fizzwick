import { describe, expect, test } from 'vitest'
import { houseDrinks } from '../house-drinks/catalog'
import type { Drink } from '../riff-engine'
import { groupByShelf, newDrinkIds } from './shelves'

const drink = (id: string, fields: Partial<Drink> = {}): Drink => ({ ...houseDrinks[0], id, ...fields })

describe('groupByShelf', () => {
  test('puts Custom Drinks first, then the Shelves in order, and leaves out empty ones', () => {
    const drinks = [
      drink('a', { shelf: 'warm-savory' }),
      drink('my-b'),
      drink('c', { shelf: 'fizzy-fruity' }),
      drink('d', { shelf: undefined }),
      drink('e', { shelf: 'fizzy-fruity' }),
    ]
    const groups = groupByShelf(drinks, (item) => item)
    expect(groups.map((group) => [group.name, group.items.map((item) => item.id)])).toEqual([
      ['Yours', ['my-b']],
      ['Fizzy & fruity', ['c', 'e']],
      ['Warm & savory', ['a']],
      ['Everything else', ['d']],
    ])
  })
})

describe('newDrinkIds', () => {
  const drinks = [
    drink('old', { added: '2026-10-21' }),
    drink('fresh-1', { added: '2026-11-05' }),
    drink('fresh-2', { added: '2026-11-05' }),
    drink('my-copy', { added: '2026-11-20' }),
    drink('undated', { added: undefined }),
  ]

  test('marks the latest batch of House Drinks, never a Custom Drink', () => {
    expect(newDrinkIds(drinks, new Date('2026-11-06T12:00:00'))).toEqual(new Set(['fresh-1', 'fresh-2']))
  })

  test('drops the mark 30 days after the batch', () => {
    expect(newDrinkIds(drinks, new Date('2026-12-04T23:00:00')).size).toBe(2)
    expect(newDrinkIds(drinks, new Date('2026-12-05T00:00:00')).size).toBe(0)
  })
})
