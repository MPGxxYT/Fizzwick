import type { Glass, Ingredient, Method, Tool } from '../riff-engine'

export const GLASS_NAMES: Record<Glass, string> = {
  collins: 'Collins glass',
  highball: 'Highball glass',
  rocks: 'Rocks glass',
  coupe: 'Coupe',
  mug: 'Mug',
  hurricane: 'Hurricane glass',
}

// "1 Collins glass", "2 Collins glasses", "3 coupes"
export function glassCount(glass: Glass, count: number): string {
  const name = glassInSentence(GLASS_NAMES[glass])
  if (count === 1) return `1 ${name}`
  return `${count} ${name.endsWith('glass') ? `${name}es` : `${name}s`}`
}

export const TOOL_NAMES: Record<Tool, string> = {
  jigger: 'Jigger',
  barspoon: 'Barspoon',
  shaker: 'Shaker',
  strainer: 'Strainer',
  'fine-strainer': 'Fine strainer',
  'mixing-glass': 'Mixing glass',
  muddler: 'Muddler',
  blender: 'Blender',
  peeler: 'Peeler',
  kettle: 'Kettle',
}

// For use mid-sentence: "Collins glass" keeps its capital, "Rocks glass"
// becomes "rocks glass".
export function glassInSentence(name: string): string {
  return name.startsWith('Collins') ? name : name.toLowerCase()
}

export const METHOD_NAMES: Record<Method, string> = {
  build: 'Build',
  shake: 'Shake',
  'dry-shake': 'Dry shake',
  stir: 'Stir',
  blend: 'Blend',
}

const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' }

// 0.75 -> "¾", 1.5 -> "1½", 2 -> "2", 0.3 -> "0.3"
function fraction(amount: number): string {
  const whole = Math.floor(amount)
  const part = FRACTIONS[String(Math.round((amount - whole) * 100) / 100)]
  if (part) return whole === 0 ? part : `${whole}${part}`
  return String(amount)
}

const plural = (amount: number, one: string, many: string) => (amount === 1 ? one : many)

// Splits an ingredient into the measure column and the name column.
export function formatIngredient({ name, amount, unit }: Ingredient): { measure: string; name: string } {
  switch (unit) {
    case 'top':
      return { measure: 'Top', name }
    case 'to-taste':
      return { measure: 'To taste', name }
    case 'fill':
      return { measure: 'Fill glass', name }
  }
  const n = amount ?? 0
  switch (unit) {
    case 'oz':
      return { measure: `${fraction(n)} oz`, name }
    case 'ml':
      return { measure: `${n} ml`, name }
    case 'dash':
      return { measure: `${n} ${plural(n, 'dash', 'dashes')}`, name }
    case 'barspoon':
      return { measure: `${fraction(n)} ${plural(n, 'barspoon', 'barspoons')}`, name }
    case 'cup':
      return { measure: `${fraction(n)} ${plural(n, 'cup', 'cups')}`, name }
    case 'count':
      return { measure: String(n), name }
  }
}

// A step that takes time before the drink can be made, such as tea that has
// to brew and chill. The Drink page shows it above the ingredients, so it
// isn't a surprise in step mode.
export function isMakeAhead(step: { text: string }): boolean {
  return /\bmake it ahead\b/i.test(step.text)
}
