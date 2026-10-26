import { describe, expect, it } from 'vitest'
import { houseDrinks } from '../house-drinks/catalog'
import { resolveRiff, type Picks } from '../riff-engine'
import { finishShow, garnishesOf } from './finish-show'

const show = (id: string, picks: Picks = {}) => {
  const drink = houseDrinks.find((candidate) => candidate.id === id)!
  return finishShow(resolveRiff(drink, { ...drink.houseSpec, ...picks }))
}
const kinds = (id: string, picks: Picks = {}) => show(id, picks).garnishes.map((garnish) => garnish.kind)

describe('the finish show', () => {
  it('plays the beat for the Riff’s Method', () => {
    expect(show('garden-smash').method).toBe('shake')
    expect(show('tea-sour').method).toBe('dry-shake')
    expect(show('cinnamon-cream', { texture: 'blended' }).method).toBe('blend')
  })

  it('gives each drink one body effect: fizz, then a coupe clink, then a shimmer', () => {
    expect(show('cherry-limeade').body).toBe('fizz')
    expect(show('spiced-pear').body).toBe('clink')
    expect(show('black-tea-old-fashioned').body).toBe('shimmer')
    expect(show('frozen-lemonade').body).toBe('shimmer')
  })

  it('fills the glass with its ice first: cubes, crushed, or one large cube', () => {
    expect(show('cherry-limeade').ice).toBe('cubes')
    expect(show('nojito').ice).toBe('crushed')
    expect(show('black-tea-old-fashioned').ice).toBe('large')
    expect(show('spiced-pear').ice).toBeNull()
    expect(show('frozen-lemonade').ice).toBeNull()
    expect(show('cinnamon-cream', { texture: 'blended' }).ice).toBeNull()
    expect(show('nada-colada').ice).toBe('crushed')
    expect(show('hibiscus-stir').ice).toBeNull()
  })

  it('fizzes a drink topped with tonic, even with coffee floated on it', () => {
    expect(show('espresso-tonic').body).toBe('fizz')
  })

  it('puts on the picked garnish, or the one the garnish step names', () => {
    expect(kinds('black-tea-old-fashioned')).toEqual(['peel'])
    expect(kinds('black-tea-old-fashioned', { garnish: 'cocktail-cherry' })).toEqual(['cherry'])
    expect(kinds('ginger-mule')).toEqual(['wedge', 'sprig'])
    expect(kinds('garden-smash', { herb: 'basil' })).toEqual(['sprig'])
    expect(kinds('cinnamon-cream')).toEqual(['dust'])
    expect(show('mango-lassi').garnishes).toEqual([{ kind: 'dust', color: '#a8a26a' }])
    expect(kinds('mango-lassi', { spice: null })).toEqual([])
    expect(kinds('cherry-limeade', { garnish: null })).toEqual([])
  })

  it('leaves the garnish out of the drink’s colors', () => {
    expect(show('cherry-limeade').layers).toEqual(['#b3123a', '#e7f5c4'])
    expect(show('frozen-lemonade').layers).not.toContain('#fde047')
  })

  it('colors a garnish by the words that name it', () => {
    expect(garnishesOf('Expressed grapefruit peel')).toEqual([{ kind: 'peel', color: '#f87171' }])
    expect(garnishesOf('Lime wedge and mint sprig').map((garnish) => garnish.color)).toEqual(['#84cc16', '#4ade80'])
    expect(garnishesOf('Pineapple wedge and cherry')).toEqual([
      { kind: 'wedge', color: '#facc15' },
      { kind: 'cherry', color: '#be123c' },
    ])
    expect(garnishesOf('Toasted coconut')).toEqual([{ kind: 'dust', color: '#c8955a' }])
    expect(garnishesOf('Cinnamon stick')).toEqual([{ kind: 'stick', color: '#8b4a24' }])
    expect(garnishesOf('Celery stalk and lemon wedge')).toEqual([
      { kind: 'stick', color: '#86b04f' },
      { kind: 'wedge', color: '#fde047' },
    ])
    expect(garnishesOf('Pickle spear')).toEqual([{ kind: 'stick', color: '#5f7d2e' }])
    expect(garnishesOf('Raspberries on a pick')).toEqual([{ kind: 'pick', color: '#e11d48' }])
  })

  it('finds a garnish for every House Drink that has one', () => {
    for (const drink of houseDrinks) {
      const slot = drink.slots.find((candidate) => candidate.id === 'garnish')
      for (const option of slot?.options ?? []) expect(kinds(drink.id, { garnish: option.id })).not.toEqual([])
    }
  })
})
