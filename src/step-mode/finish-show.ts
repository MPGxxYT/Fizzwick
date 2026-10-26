import { isFizzy } from '../drink-page/ambience-for'
import type { Method, Riff } from '../riff-engine'

// What the finish screen plays for a Riff, in the order you'd make it: the
// ice goes into the empty glass, the drink is poured in a way that shows its
// Method, one effect plays in the glass, then the garnish goes on last.

// After the pour, one of these, never more, so the finish stays readable:
// fizz bursts out of a topped drink, a coupe clinks with a second coupe, and
// anything else gets a shimmer.
export type BodyEffect = 'fizz' | 'clink' | 'shimmer'

// How long the ice takes to go in. Everything after it, the pour onwards,
// starts that much later (the CSS reads it as --shift).
export const ICE_SECONDS = 0.6

// The ice the glass is filled with first: regular cubes, crushed ice, or one
// large cube.
export type IceKind = 'cubes' | 'crushed' | 'large'

export type GarnishKind = 'wheel' | 'wedge' | 'cherry' | 'sprig' | 'peel' | 'dust' | 'slice' | 'pick' | 'stick'

export interface Garnish {
  kind: GarnishKind
  color: string
}

export interface FinishShow {
  method: Method
  ice: IceKind | null
  body: BodyEffect
  garnishes: Garnish[]
  // The drink's colors, one per filled Slot in order, garnish left out since
  // it sits on the glass, not in the drink. A built drink stacks them as
  // layers, first Slot at the bottom.
  layers: string[]
}

// Each garnish kind: the word that names it, and the words that set its
// color, the first one found in the garnish step winning.
const GARNISHES: { kind: GarnishKind; word: RegExp; colors: [RegExp, string][]; color: string }[] = [
  { kind: 'wheel', word: /\bwheel\b/, colors: CITRUS(), color: '#fde047' },
  { kind: 'wedge', word: /\bwedge\b/, colors: CITRUS(), color: '#84cc16' },
  { kind: 'peel', word: /\bpeel\b/, colors: CITRUS(), color: '#fb923c' },
  { kind: 'cherry', word: /\bcherr(y|ies)\b/, colors: [], color: '#be123c' },
  {
    kind: 'sprig',
    word: /\bsprigs?\b/,
    colors: [
      [/\bmint\b/, '#4ade80'],
      [/\bbasil\b/, '#3f9d4a'],
      [/\bthyme\b/, '#9aa86a'],
      [/\brosemary\b/, '#6b8f71'],
      [/\blavender\b/, '#a78bfa'],
    ],
    color: '#4ade80',
  },
  {
    kind: 'dust',
    word: /\b(nutmeg|cinnamon|coconut|cardamom)\b(?! stick)/,
    colors: [
      [/\bnutmeg\b/, '#9a6a3f'],
      [/\bcinnamon\b/, '#b45f2c'],
      [/\bcoconut\b/, '#c8955a'],
      [/\bcardamom\b/, '#a8a26a'],
    ],
    color: '#9a6a3f',
  },
  {
    kind: 'slice',
    word: /\b(slice|strawberry)\b/,
    colors: [
      [/\bpear\b/, '#d9e47a'],
      [/\bapple\b/, '#f3e3a1'],
      [/\bstrawberry\b/, '#ef4444'],
    ],
    color: '#d9e47a',
  },
  {
    kind: 'pick',
    word: /\b(pick|candied ginger)\b/,
    colors: [
      [/\bblueberr/, '#4f46e5'],
      [/\braspberr/, '#e11d48'],
      [/\bginger\b/, '#e0a43a'],
    ],
    color: '#e0a43a',
  },
  {
    kind: 'stick',
    word: /\b(stick|stalk|spear)\b/,
    colors: [
      [/\bcinnamon\b/, '#8b4a24'],
      [/\bcelery\b/, '#86b04f'],
      [/\bpickle\b/, '#5f7d2e'],
    ],
    color: '#8b4a24',
  },
]

function CITRUS(): [RegExp, string][] {
  return [
    [/\blime\b/, '#84cc16'],
    [/\blemon\b/, '#fde047'],
    [/\bgrapefruit\b/, '#f87171'],
    [/\borange\b/, '#fb923c'],
    [/\bpineapple\b/, '#facc15'],
  ]
}

// The garnishes named in the Riff's garnish step, in the order the step
// names them, at most two ("lime wedge and mint sprig").
export function garnishesOf(text: string): Garnish[] {
  const lower = text.toLowerCase()
  return GARNISHES.flatMap((garnish) => {
    const at = lower.search(garnish.word)
    if (at < 0) return []
    const color = garnish.colors.find(([word]) => word.test(lower))?.[1] ?? garnish.color
    return [{ at, kind: garnish.kind, color }]
  })
    .sort((a, b) => a.at - b.at)
    .slice(0, 2)
    .map(({ kind, color }) => ({ kind, color }))
}

export function finishShow(riff: Riff): FinishShow {
  // The picked garnish Option names it best ("Expressed orange peel"). Drinks
  // without a garnish Slot name theirs in a step called garnish.
  const garnishSlot = riff.slots.find((slot) => slot.id === 'garnish')
  const garnishText = garnishSlot ? garnishSlot.option?.label : riff.steps.find((step) => step.id === 'garnish')?.text
  // Ice that goes into the glass. Blended drinks put theirs in the blender.
  const ice =
    riff.method === 'blend'
      ? undefined
      : riff.ingredients.find(
          (ingredient) => /\bice\b/.test(ingredient.name) && (ingredient.unit === 'fill' || /\bcube\b/.test(ingredient.name)),
        )
  const iceKind: IceKind | null = !ice
    ? null
    : /\b(large|big) ice cube\b/.test(ice.name)
      ? 'large'
      : /\bcrushed\b/.test(ice.name)
        ? 'crushed'
        : 'cubes'
  const body: BodyEffect = isFizzy(riff) ? 'fizz' : riff.glass === 'coupe' ? 'clink' : 'shimmer'
  return {
    method: riff.method,
    ice: iceKind,
    body,
    garnishes: garnishText ? garnishesOf(garnishText) : [],
    // The Riff's colors line up with its filled Slots.
    layers: riff.slots
      .filter((slot) => slot.option !== null)
      .map((slot, i) => ({ slot: slot.id, color: riff.colors[i] }))
      .filter(({ slot }) => slot !== 'garnish')
      .map(({ color }) => color),
  }
}
