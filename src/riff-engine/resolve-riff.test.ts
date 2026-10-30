import { describe, expect, test } from 'vitest'
import cherryLimeadeFile from '../house-drinks/cherry-limeade.json'
import { checkEveryRiff, parseDrinkFile, resolveRiff, type Drink } from '.'

function parse(input: unknown): Drink {
  const result = parseDrinkFile(input)
  if (!result.ok) throw new Error(result.errors.join('\n'))
  return result.drink
}

const cherryLimeade = parse(cherryLimeadeFile)

// A shaken test Drink with a Method override, a duration override,
// Dietary Tags, a step tied to one Option, and a Retired Option.
function testSour(change: (drink: Record<string, any>) => void = () => {}): Drink {
  const drink: Record<string, any> = {
    formatVersion: 1,
    id: 'test-sour',
    name: 'Test Sour',
    glass: 'coupe',
    method: 'shake',
    flavorTags: ['citrus'],
    photo: 'photos/test-sour.jpg',
    ingredients: [{ name: 'fresh lemon juice', amount: 0.75, unit: 'oz' }],
    slots: [
      {
        id: 'base',
        label: 'Base',
        options: [
          {
            id: 'black-tea',
            label: 'Black tea',
            phrase: 'black tea',
            ingredients: [{ name: 'chilled black tea', amount: 2, unit: 'oz' }],
            dietaryTags: ['caffeine'],
            color: '#7c2d12',
          },
          {
            id: 'rooibos',
            label: 'Rooibos',
            phrase: 'rooibos',
            ingredients: [{ name: 'chilled rooibos', amount: 2, unit: 'oz' }],
            durations: { steep: 360 },
            color: '#b45309',
          },
          {
            id: 'green-tea',
            label: 'Green tea',
            ingredients: [{ name: 'chilled green tea', amount: 2, unit: 'oz' }],
            color: '#65a30d',
            retired: true,
          },
        ],
      },
      {
        id: 'foam',
        label: 'Foam',
        optional: true,
        options: [
          {
            id: 'egg-white',
            label: 'Egg white',
            phrase: 'egg white',
            ingredients: [{ name: 'egg white', amount: 1, unit: 'count' }],
            dietaryTags: ['egg'],
            color: '#fef3c7',
          },
          {
            id: 'frozen',
            label: 'Frozen',
            ingredients: [{ name: 'ice', amount: 1, unit: 'cup' }],
            method: 'blend',
            removeSteps: ['strain'],
            addSteps: [{ after: 'add-all', step: { id: 'blend', text: 'Blend until smooth.' } }],
            color: '#e0f2fe',
          },
        ],
      },
    ],
    steps: [
      { id: 'steep', text: 'Steep the {base} and chill it.', tools: ['kettle'], durationSeconds: 240 },
      { id: 'add-all', text: 'Add the lemon juice and {base}.', tools: ['jigger'] },
      { id: 'dry-shake', text: 'Shake hard without ice to whip the {foam}.', when: { slot: 'foam', option: 'egg-white' } },
      { id: 'strain', text: 'Shake with ice and strain into a chilled coupe.' },
    ],
    houseSpec: { base: 'black-tea', foam: 'egg-white' },
  }
  change(drink)
  return parse(drink)
}

const stepIds = (drink: Drink, picks?: Record<string, string | null>) =>
  resolveRiff(drink, picks).steps.map((step) => step.id)

describe('resolveRiff', () => {
  test('resolves the Cherry Limeade House Spec', () => {
    const riff = resolveRiff(cherryLimeade)
    expect(riff.isHouseSpec).toBe(true)
    expect(riff.glass).toBe('collins')
    expect(riff.method).toBe('build')
    // Pours first, then the ice, then the garnish.
    expect(riff.ingredients).toEqual([
      { name: 'fresh lime juice', amount: 0.75, unit: 'oz' },
      { name: 'cherry syrup', amount: 0.75, unit: 'oz' },
      { name: 'lemon-lime soda', unit: 'top' },
      { name: 'ice', unit: 'fill' },
      { name: 'lime wheel', amount: 1, unit: 'count' },
      { name: 'cherry', amount: 1, unit: 'count' },
    ])
    expect(riff.steps.map((step) => step.text)).toEqual([
      'Fill a Collins glass with ice.',
      'Pour the lime juice and cherry syrup over the ice.',
      'Top with lemon-lime soda.',
      'Stir gently with a barspoon, just enough to mix without losing the fizz.',
      'Garnish with a lime wheel and a cherry.',
    ])
  })

  test('lays out the Mise en Place: glass, tools and ingredients', () => {
    const riff = resolveRiff(cherryLimeade)
    expect(riff.miseEnPlace).toEqual({ glass: 'collins', glassCount: 1, tools: ['jigger', 'barspoon'], ingredients: riff.ingredients })
  })

  test('swapping into an optional Slot adds its ingredient and its step', () => {
    const riff = resolveRiff(cherryLimeade, { sweetener: 'agave' })
    expect(riff.ingredients).toContainEqual({ name: 'agave', amount: 0.5, unit: 'oz' })
    expect(riff.steps.map((step) => step.text)).toContain('Add the agave.')
    expect(riff.isHouseSpec).toBe(false)
  })

  test('an empty optional Slot drops its ingredients and steps', () => {
    const riff = resolveRiff(cherryLimeade, { garnish: null })
    expect(riff.ingredients.map((ingredient) => ingredient.name)).not.toContain('lime wheel')
    expect(riff.steps.map((step) => step.id)).not.toContain('garnish')
  })

  test('muddled cherries add muddle and fine strain steps and drop the pour step', () => {
    const riff = resolveRiff(cherryLimeade, { cherry: 'muddled-cherries' })
    expect(riff.steps.map((step) => step.id)).toEqual([
      'muddle-cherries',
      'fill-glass',
      'strain-cherries',
      'top',
      'stir',
      'garnish',
    ])
    expect(riff.steps[0].text).toBe('Muddle the cherries with the lime juice in a shaker tin.')
    expect(riff.miseEnPlace.tools).toEqual(['muddler', 'shaker', 'jigger', 'strainer', 'fine-strainer', 'barspoon'])
  })

  test('the Method brings its tools, before the tools the steps add', () => {
    expect(resolveRiff(testSour()).miseEnPlace.tools).toEqual(['shaker', 'strainer', 'kettle', 'jigger'])
  })

  test('an Option can change the Method, and the tools follow', () => {
    const riff = resolveRiff(testSour(), { foam: 'frozen' })
    expect(riff.method).toBe('blend')
    expect(riff.miseEnPlace.tools).toEqual(['blender', 'kettle', 'jigger'])
    expect(stepIds(testSour(), { foam: 'frozen' })).toEqual(['steep', 'add-all', 'blend'])
  })

  test('a step tied to one Option shows only with that Option', () => {
    expect(stepIds(testSour())).toContain('dry-shake')
    expect(stepIds(testSour(), { foam: null })).not.toContain('dry-shake')
  })

  test('each step reports its tools and duration, with Option overrides', () => {
    const steep = (picks?: Record<string, string | null>) => resolveRiff(testSour(), picks).steps[0]
    expect(steep()).toMatchObject({ id: 'steep', text: 'Steep the black tea and chill it.', tools: ['kettle'], durationSeconds: 240 })
    expect(steep({ base: 'rooibos' }).durationSeconds).toBe(360)
    expect(resolveRiff(testSour()).steps[1]).toMatchObject({ id: 'add-all', text: 'Add the lemon juice and black tea.', tools: ['jigger'] })
    expect(resolveRiff(testSour()).steps[1]).not.toHaveProperty('durationSeconds')
  })

  test('added steps go after the step they name, in Slot order', () => {
    const drink = testSour((d) => {
      d.slots[0].options[0].addSteps = [{ after: 'add-all', step: { id: 'taste', text: 'Taste it.' } }]
    })
    expect(stepIds(drink, { foam: 'frozen' })).toEqual(['steep', 'add-all', 'taste', 'blend'])
  })

  test('Dietary Tags are those of the current Options', () => {
    expect(resolveRiff(testSour()).dietaryTags).toEqual(['caffeine', 'egg'])
    expect(resolveRiff(testSour(), { base: 'rooibos', foam: null }).dietaryTags).toEqual([])
  })

  test('tint colors come from the current Options in Slot order', () => {
    expect(resolveRiff(testSour(), { base: 'rooibos' }).colors).toEqual(['#b45309', '#fef3c7'])
    expect(resolveRiff(testSour(), { foam: null }).colors).toEqual(['#7c2d12'])
  })

  test('lists each Slot with its current Option', () => {
    expect(resolveRiff(testSour(), { foam: null }).slots).toEqual([
      { id: 'base', label: 'Base', option: { id: 'black-tea', label: 'Black tea', retired: false } },
      { id: 'foam', label: 'Foam', option: null },
    ])
  })

  test('a Slot missing from the picks uses the House Spec', () => {
    const riff = resolveRiff(cherryLimeade, { fizz: 'soda-water' })
    expect(riff.picks).toEqual({ cherry: 'cherry-syrup', sweetener: null, fizz: 'soda-water', garnish: 'lime-wheel-and-cherry' })
  })

  test('a Retired Option still resolves and is marked as retired', () => {
    const riff = resolveRiff(testSour(), { base: 'green-tea' })
    expect(riff.slots[0].option).toEqual({ id: 'green-tea', label: 'Green tea', retired: true })
    expect(riff.steps[0].text).toBe('Steep the Green tea and chill it.')
  })

  test('names a Favorite by the Drink and what differs from its House Spec', () => {
    expect(resolveRiff(cherryLimeade).defaultFavoriteName).toBe('Cherry Limeade')
    expect(resolveRiff(cherryLimeade, { fizz: 'soda-water', sweetener: 'agave' }).defaultFavoriteName).toBe(
      'Cherry Limeade · agave, soda water',
    )
    expect(resolveRiff(cherryLimeade, { garnish: null }).defaultFavoriteName).toBe('Cherry Limeade · no garnish')
  })

  test('rejects picks that do not fit the Drink', () => {
    expect(() => resolveRiff(cherryLimeade, { fizz: 'cola' })).toThrow('Slot "fizz" has no Option "cola"')
    expect(() => resolveRiff(cherryLimeade, { fizz: null })).toThrow('Slot "fizz" is not optional')
    expect(() => resolveRiff(cherryLimeade, { bubbles: 'soda-water' })).toThrow('unknown Slot "bubbles"')
  })
})

describe('checkEveryRiff', () => {
  test('finds no problems in Drinks whose placeholders always resolve', () => {
    expect(checkEveryRiff(cherryLimeade)).toEqual([])
    expect(checkEveryRiff(testSour())).toEqual([])
  })

  test('reports a step that names an empty optional Slot', () => {
    const drink = testSour((d) => {
      delete d.steps[2].when
    })
    expect(checkEveryRiff(drink)).toEqual([
      'Riff base=black-tea, foam=(empty): step "dry-shake" has unresolved {foam}',
      'Riff base=rooibos, foam=(empty): step "dry-shake" has unresolved {foam}',
      'Riff base=green-tea, foam=(empty): step "dry-shake" has unresolved {foam}',
    ])
  })
})
