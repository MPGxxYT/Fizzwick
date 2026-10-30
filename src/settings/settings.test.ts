import { describe, expect, it } from 'vitest'
import { defaultSettings, readSettings } from './settings'

describe('defaultSettings', () => {
  it('uses ounces in the US, Liberia and Myanmar', () => {
    expect(defaultSettings('en-US').units).toBe('oz')
    expect(defaultSettings('en-LR').units).toBe('oz')
    expect(defaultSettings('my-MM').units).toBe('oz')
  })

  it('uses millilitres everywhere else', () => {
    expect(defaultSettings('en-GB').units).toBe('ml')
    expect(defaultSettings('fr-FR').units).toBe('ml')
    expect(defaultSettings('es-MX').units).toBe('ml')
  })

  it('takes the likely region for a language with none', () => {
    expect(defaultSettings('en').units).toBe('oz')
    expect(defaultSettings('de').units).toBe('ml')
  })

  it('falls back to ounces for a locale it cannot read', () => {
    expect(defaultSettings('not a locale!').units).toBe('oz')
  })

  it('shows Bar Term underlines', () => {
    expect(defaultSettings('en-US').underlines).toBe(true)
  })
})

describe('readSettings', () => {
  it('reads saved settings', () => {
    expect(readSettings('{"units":"ml","underlines":false,"canMake":true}', 'en-US')).toEqual({
      units: 'ml',
      underlines: false,
      canMake: true,
    })
  })

  it('uses the defaults when nothing is saved', () => {
    expect(readSettings(null, 'en-GB')).toEqual({ units: 'ml', underlines: true, canMake: false })
  })

  it('keeps what is valid and defaults the rest', () => {
    expect(readSettings('{"units":"cups","underlines":false,"canMake":"yes"}', 'en-US')).toEqual({
      units: 'oz',
      underlines: false,
      canMake: false,
    })
    expect(readSettings('{"units":"ml"}', 'en-US')).toEqual({ units: 'ml', underlines: true, canMake: false })
  })

  it('uses the defaults for anything that is not saved settings', () => {
    const defaults = { units: 'oz', underlines: true, canMake: false }
    expect(readSettings('not json', 'en-US')).toEqual(defaults)
    expect(readSettings('[1,2]', 'en-US')).toEqual(defaults)
    expect(readSettings('null', 'en-US')).toEqual(defaults)
  })
})
