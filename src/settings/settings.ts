import type { Units } from '../riff-engine'

// Settings, and the Drink list's Can make toggle, which stays on across visits.
// Pure: the store that keeps them is in use-settings.ts.
export interface Settings {
  units: Units
  underlines: boolean // Bar Term underlines
  canMake: boolean
}

// The countries that measure drinks in ounces.
const OUNCE_REGIONS = new Set(['US', 'LR', 'MM'])

// Ounces in the US, Liberia and Myanmar, millilitres elsewhere. A language
// with no region ("en") counts as its most likely one.
export function defaultSettings(locale: string): Settings {
  let region: string | undefined
  try {
    region = new Intl.Locale(locale).maximize().region
  } catch {
    region = undefined
  }
  return { units: region && !OUNCE_REGIONS.has(region) ? 'ml' : 'oz', underlines: true, canMake: false }
}

// Saved settings as stored, checked field by field: anything missing or
// unreadable takes its default.
export function readSettings(saved: string | null, locale: string): Settings {
  const defaults = defaultSettings(locale)
  let value: unknown
  try {
    value = saved === null ? null : JSON.parse(saved)
  } catch {
    return defaults
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return defaults
  const { units, underlines, canMake } = value as Record<string, unknown>
  return {
    units: units === 'oz' || units === 'ml' ? units : defaults.units,
    underlines: typeof underlines === 'boolean' ? underlines : defaults.underlines,
    canMake: typeof canMake === 'boolean' ? canMake : defaults.canMake,
  }
}
