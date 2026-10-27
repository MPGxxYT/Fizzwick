// The Drink file format, version 1. House Drinks use it today and shared
// Custom Drinks will use it later, so it is a public contract (ADR 0001).
import { z } from 'zod'

export const FORMAT_VERSION = 1

export const GLASSES = ['collins', 'highball', 'rocks', 'coupe', 'mug', 'hurricane'] as const
export const METHODS = ['build', 'shake', 'stir', 'blend', 'dry-shake'] as const
export const FLAVOR_TAGS = ['citrus', 'fruity', 'herbal', 'creamy', 'spicy', 'bitter', 'smoky', 'savory'] as const
export const DIETARY_TAGS = ['caffeine', 'dairy', 'nuts', 'egg'] as const
export const TOOLS = [
  'jigger',
  'barspoon',
  'shaker',
  'strainer',
  'fine-strainer',
  'mixing-glass',
  'muddler',
  'blender',
  'peeler',
  'kettle',
] as const

// Measured units need an amount. Unmeasured ones never have one:
// Top fills the rest of the glass, fill means fill the glass (with ice).
export const MEASURED_UNITS = ['oz', 'ml', 'dash', 'barspoon', 'cup', 'count'] as const
export const UNMEASURED_UNITS = ['top', 'to-taste', 'fill'] as const

const id = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: 'must be lowercase kebab-case, such as "cherry-syrup"' })

const oneOf = <const T extends readonly [string, ...string[]]>(values: T, what: string) =>
  z.enum(values, { error: (issue) => `unknown ${what} ${JSON.stringify(issue.input)}` })

const ingredient = z.strictObject({
  name: z.string().min(1),
  amount: z.number().positive().optional(),
  unit: oneOf([...MEASURED_UNITS, ...UNMEASURED_UNITS], 'unit'),
})

const step = z.strictObject({
  id,
  // {slot-id} placeholders are filled with the current Option's phrase.
  text: z.string().min(1),
  tools: z.array(oneOf(TOOLS, 'tool')).optional(),
  durationSeconds: z.number().int().positive().optional(),
  // Show the step only when the Slot is filled, or holds the given Option.
  when: z.strictObject({ slot: id, option: id.optional() }).optional(),
})

const option = z.strictObject({
  id,
  label: z.string().min(1),
  // Wording used for this Option's placeholders in steps; defaults to the label.
  phrase: z.string().min(1).optional(),
  ingredients: z.array(ingredient),
  dietaryTags: z.array(oneOf(DIETARY_TAGS, 'Dietary Tag')).optional(),
  method: oneOf(METHODS, 'Method').optional(),
  // Added steps with no `after` go first.
  addSteps: z.array(z.strictObject({ after: id.optional(), step })).optional(),
  removeSteps: z.array(id).optional(),
  durations: z.record(id, z.number().int().positive()).optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, { error: 'must be a hex color such as "#b3123a"' }),
  retired: z.boolean().optional(),
})

const slot = z.strictObject({
  id,
  label: z.string().min(1),
  optional: z.boolean().optional(),
  options: z.array(option).min(1),
})

export const drinkSchema = z.strictObject({
  formatVersion: z.literal(FORMAT_VERSION, { error: (issue) => `unsupported version ${JSON.stringify(issue.input)}` }),
  id,
  name: z.string().min(1),
  glass: oneOf(GLASSES, 'glass'),
  method: oneOf(METHODS, 'Method'),
  flavorTags: z.array(oneOf(FLAVOR_TAGS, 'Flavor Tag')).min(1),
  // House Drinks ship a photo path; a Custom Drink's photo lives on the phone.
  photo: z.string().min(1).optional(),
  // Fixed ingredients, outside any Slot.
  ingredients: z.array(ingredient),
  slots: z.array(slot).min(1),
  steps: z.array(step).min(1),
  // One Option ID per Slot, or null to leave an optional Slot empty.
  houseSpec: z.record(z.string(), id.nullable()),
})

export type Drink = z.infer<typeof drinkSchema>
export type Slot = Drink['slots'][number]
export type Option = Slot['options'][number]
export type Step = Drink['steps'][number]
export type Ingredient = Drink['ingredients'][number]
export type Glass = (typeof GLASSES)[number]
export type Method = (typeof METHODS)[number]
export type FlavorTag = (typeof FLAVOR_TAGS)[number]
export type DietaryTag = (typeof DIETARY_TAGS)[number]
export type Tool = (typeof TOOLS)[number]
