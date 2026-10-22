import { describe, expect, test } from 'vitest'
import { parseDrinkFile } from '.'

// A small valid Drink. Each test copies it and breaks one thing.
function validDrink() {
  return {
    formatVersion: 1,
    id: 'test-fizz',
    name: 'Test Fizz',
    glass: 'collins',
    method: 'build',
    flavorTags: ['citrus'],
    photo: 'photos/test-fizz.jpg',
    ingredients: [
      { name: 'ice', unit: 'fill' },
      { name: 'fresh lime juice', amount: 0.75, unit: 'oz' },
    ],
    slots: [
      {
        id: 'fizz',
        label: 'Fizz',
        options: [
          {
            id: 'soda-water',
            label: 'Soda water',
            ingredients: [{ name: 'soda water', unit: 'top' }],
            color: '#e0f2fe',
          },
          {
            id: 'tonic',
            label: 'Tonic',
            ingredients: [{ name: 'tonic', unit: 'top' }],
            color: '#f1f5f9',
          },
        ],
      },
      {
        id: 'garnish',
        label: 'Garnish',
        optional: true,
        options: [
          {
            id: 'lime-wheel',
            label: 'Lime wheel',
            ingredients: [{ name: 'lime wheel', amount: 1, unit: 'count' }],
            color: '#84cc16',
          },
        ],
      },
    ],
    steps: [
      { id: 'fill-glass', text: 'Fill a Collins glass with ice.' },
      { id: 'add-lime', text: 'Pour in the lime juice.', tools: ['jigger'] },
      { id: 'top', text: 'Top with {fizz}.' },
      { id: 'garnish', text: 'Garnish with a {garnish}.', when: { slot: 'garnish' } },
    ],
    houseSpec: { fizz: 'soda-water', garnish: 'lime-wheel' },
  }
}

type DrinkInput = ReturnType<typeof validDrink>

function errorsFor(change: (drink: DrinkInput) => unknown): string[] {
  const drink = validDrink()
  const changed = change(drink) ?? drink
  const result = parseDrinkFile(changed)
  if (result.ok) throw new Error('expected the Drink file to be rejected')
  return result.errors
}

describe('parseDrinkFile', () => {
  test('accepts a valid Drink and returns it', () => {
    const result = parseDrinkFile(validDrink())
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.drink.id).toBe('test-fizz')
      expect(result.drink.slots.map((slot) => slot.id)).toEqual(['fizz', 'garnish'])
    }
  })

  test('rejects something that is not a Drink at all', () => {
    const result = parseDrinkFile('not a drink')
    expect(result.ok).toBe(false)
  })

  test('reports missing fields by path', () => {
    const errors = errorsFor((drink) => {
      const { name: _name, ...rest } = drink
      return rest
    })
    expect(errors).toContainEqual(expect.stringMatching(/^name: /))
  })

  test('reports a missing field inside an Option by path', () => {
    const errors = errorsFor((drink) => {
      const { color: _color, ...rest } = drink.slots[0].options[1]
      drink.slots[0].options[1] = rest as typeof drink.slots[0]['options'][1]
    })
    expect(errors).toContainEqual(expect.stringMatching(/^slots\[0\]\.options\[1\]\.color: /))
  })

  test('rejects unknown fields so typos do not pass silently', () => {
    const errors = errorsFor((drink) => ({ ...drink, galss: 'coupe' }))
    expect(errors.join('\n')).toMatch(/galss/)
  })

  test('rejects a format version it does not know', () => {
    const errors = errorsFor((drink) => ({ ...drink, formatVersion: 2 }))
    expect(errors).toContainEqual(expect.stringMatching(/^formatVersion: /))
  })

  test('rejects IDs that are not lowercase kebab-case', () => {
    const errors = errorsFor((drink) => {
      drink.slots[0].options[0].id = 'Soda Water'
      drink.houseSpec.fizz = 'Soda Water'
    })
    expect(errors).toContainEqual(expect.stringMatching(/^slots\[0\]\.options\[0\]\.id: /))
  })

  test('rejects duplicate Slot IDs', () => {
    const errors = errorsFor((drink) => {
      drink.slots[1].id = 'fizz'
    })
    expect(errors).toContain('slots: duplicate Slot ID "fizz"')
  })

  test('rejects duplicate Option IDs within a Slot', () => {
    const errors = errorsFor((drink) => {
      drink.slots[0].options[1].id = 'soda-water'
    })
    expect(errors).toContain('Slot "fizz": duplicate Option ID "soda-water"')
  })

  test('rejects duplicate step IDs, including steps added by Options', () => {
    const errors = errorsFor((drink) => {
      Object.assign(drink.slots[0].options[1], {
        addSteps: [{ after: 'fill-glass', step: { id: 'top', text: 'Stir.' } }],
      })
    })
    expect(errors).toContain('steps: duplicate step ID "top"')
  })

  test('rejects a House Spec that names an unknown Option', () => {
    const errors = errorsFor((drink) => {
      drink.houseSpec.fizz = 'ginger-beer'
    })
    expect(errors).toContain('houseSpec: Slot "fizz" has no Option "ginger-beer"')
  })

  test('rejects a House Spec that leaves out a Slot', () => {
    const errors = errorsFor((drink) => {
      const { garnish: _garnish, ...rest } = drink.houseSpec
      drink.houseSpec = rest as DrinkInput['houseSpec']
    })
    expect(errors).toContain('houseSpec: missing Slot "garnish" (use null to leave an optional Slot empty)')
  })

  test('rejects a House Spec that names an unknown Slot', () => {
    const errors = errorsFor((drink) => {
      Object.assign(drink.houseSpec, { sweetener: 'agave' })
    })
    expect(errors).toContain('houseSpec: unknown Slot "sweetener"')
  })

  test('rejects a House Spec that leaves a required Slot empty', () => {
    const errors = errorsFor((drink) => {
      Object.assign(drink.houseSpec, { fizz: null })
    })
    expect(errors).toContain('houseSpec: Slot "fizz" is not optional and cannot be empty')
  })

  test('allows a House Spec to leave an optional Slot empty', () => {
    const drink = validDrink()
    Object.assign(drink.houseSpec, { garnish: null })
    expect(parseDrinkFile(drink).ok).toBe(true)
  })

  test('rejects a House Spec that uses a Retired Option', () => {
    const errors = errorsFor((drink) => {
      Object.assign(drink.slots[0].options[0], { retired: true })
    })
    expect(errors).toContain('houseSpec: Option "soda-water" in Slot "fizz" is retired')
  })

  test('rejects a Slot whose Options are all retired', () => {
    const errors = errorsFor((drink) => {
      Object.assign(drink.slots[1].options[0], { retired: true })
      Object.assign(drink.houseSpec, { garnish: null })
    })
    expect(errors).toContain('Slot "garnish": every Option is retired')
  })

  test('rejects unknown tools', () => {
    const errors = errorsFor((drink) => {
      Object.assign(drink.steps[1], { tools: ['spoon'] })
    })
    expect(errors).toContainEqual(expect.stringMatching(/^steps\[1\]\.tools\[0\]: unknown tool "spoon"/))
  })

  test('rejects an amount on Top, and a missing amount on oz', () => {
    const errors = errorsFor((drink) => {
      Object.assign(drink.slots[0].options[0].ingredients[0], { amount: 2 })
      const { amount: _amount, ...lime } = drink.ingredients[1]
      drink.ingredients[1] = lime as DrinkInput['ingredients'][1]
    })
    expect(errors).toContain('slots[0].options[0].ingredients[0]: "top" has no amount')
    expect(errors).toContain('ingredients[1]: "oz" needs a positive amount')
  })

  test('rejects step placeholders that name an unknown Slot', () => {
    const errors = errorsFor((drink) => {
      drink.steps[2].text = 'Top with {bubbles}.'
    })
    expect(errors).toContain('step "top": placeholder {bubbles} names an unknown Slot')
  })

  test('rejects step references to unknown steps, Slots and Options', () => {
    const errors = errorsFor((drink) => {
      Object.assign(drink.slots[0].options[1], {
        addSteps: [{ after: 'chill', step: { id: 'stir', text: 'Stir.' } }],
        removeSteps: ['shake'],
        durations: { steep: 60 },
      })
      Object.assign(drink.steps[3], { when: { slot: 'fizz', option: 'cola' } })
    })
    expect(errors).toContain('Option "tonic" in Slot "fizz": addSteps after unknown step "chill"')
    expect(errors).toContain('Option "tonic" in Slot "fizz": removeSteps names unknown step "shake"')
    expect(errors).toContain('Option "tonic" in Slot "fizz": durations names unknown step "steep"')
    expect(errors).toContain('step "garnish": when names unknown Option "cola" in Slot "fizz"')
  })

  test('reports every problem at once', () => {
    const errors = errorsFor((drink) => {
      drink.slots[1].id = 'fizz'
      drink.houseSpec.fizz = 'ginger-beer'
    })
    expect(errors.length).toBeGreaterThanOrEqual(2)
  })
})
