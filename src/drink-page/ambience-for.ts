import type { Riff } from '../riff-engine'

// Which background animations a Riff gets. Each Drink may get its own later.

// Bubbles for fizzy Riffs: every House Drink that is topped up is topped
// with something carbonated.
export function isFizzy(riff: Riff): boolean {
  return riff.ingredients.some((ingredient) => ingredient.unit === 'top')
}

// Ice cubes for rocks drinks served on ice. Ice measured in cups goes into
// the blender, not the glass. (\b keeps "juice" from counting.)
export function hasIceInGlass(riff: Riff): boolean {
  return (
    riff.glass === 'rocks' &&
    riff.ingredients.some(
      (ingredient) => /\bice\b/.test(ingredient.name) && (ingredient.unit === 'fill' || /\bcube\b/.test(ingredient.name)),
    )
  )
}
