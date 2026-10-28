import { DIETARY_TAGS, TOOLS, type DietaryTag, type Tool } from '../riff-engine'

// Suggestions the editor offers from the words in a step or an Option. They
// are only ever suggestions: the user ticks a tool or a Dietary Tag, and can
// pick any color.

const TOOL_WORDS: [Tool, RegExp][] = [
  ['jigger', /\b(measure|pour)/],
  ['shaker', /\bshak/],
  // "Double strain" and "fine strain" take a fine strainer; plain straining
  // takes the ordinary one.
  ['fine-strainer', /\b(double|fine)[ -]strain/],
  ['strainer', /(?<!double |fine |double-|fine-)\bstrain/],
  ['muddler', /\bmuddl/],
  ['barspoon', /\bstir/],
  ['blender', /\bblend/],
  ['peeler', /\b(peel|express|twist)/],
  ['kettle', /\b(steep|boil|brew|kettle)/],
]

export function suggestTools(text: string): Tool[] {
  const words = text.toLowerCase()
  const found = new Set(TOOL_WORDS.filter(([, rule]) => rule.test(words)).map(([tool]) => tool))
  return TOOLS.filter((tool) => found.has(tool))
}

// Plant milks and creams aren't dairy; almond milk is nuts. Herbal teas
// (rooibos, chamomile, hibiscus) have no caffeine; nutmeg isn't a nut.
const TAG_WORDS: [DietaryTag, RegExp][] = [
  ['caffeine', /\b(coffee|espresso|cold brew|black tea|green tea|lapsang|chai|matcha|earl grey|cola)\b/],
  ['dairy', /\b(?<!(oat|almond|coconut|soy|rice|cashew) )(milk|cream|yogurt)\b|half-and-half|\bbutter\b|\bcheese\b/],
  ['nuts', /\b(almond|walnut|pecan|hazelnut|cashew|pistachio|peanut|orgeat)/],
  ['egg', /\begg\b/],
]

export function suggestDietaryTags(ingredientNames: string[]): DietaryTag[] {
  const words = ingredientNames.join(' \n ').toLowerCase()
  const found = new Set(TAG_WORDS.filter(([, rule]) => rule.test(words)).map(([tag]) => tag))
  return DIETARY_TAGS.filter((tag) => found.has(tag))
}

// About 16 swatches an Option's color can be picked from, chosen to look
// like drink ingredients on the night background.
export const PALETTE: { name: string; color: string }[] = [
  { name: 'cherry', color: '#b3123a' },
  { name: 'raspberry', color: '#e0457b' },
  { name: 'grapefruit', color: '#ff8a7a' },
  { name: 'orange', color: '#f59e0b' },
  { name: 'lemon', color: '#f5d94a' },
  { name: 'lime', color: '#a3e635' },
  { name: 'mint', color: '#3fbf7f' },
  { name: 'cucumber', color: '#c7ecb2' },
  { name: 'soda', color: '#e0f2fe' },
  { name: 'blueberry', color: '#6d5bd0' },
  { name: 'lavender', color: '#b9a3e8' },
  { name: 'tea', color: '#b5651d' },
  { name: 'coffee', color: '#5b3a24' },
  { name: 'honey', color: '#d6a84a' },
  { name: 'cream', color: '#f3ead8' },
  { name: 'tomato', color: '#d6402b' },
]

const COLOR_WORDS: [string, RegExp][] = [
  ['coffee', /coffee|espresso|cold brew|cola|chocolate/],
  ['tea', /\btea\b|rooibos|lapsang|chai|cinnamon|demerara|maple|ginger|nutmeg/],
  ['tomato', /tomato/],
  ['cherry', /cherr|cranberr|pomegranate|grenadine|hibiscus/],
  ['raspberry', /raspberr|strawberr|watermelon/],
  ['grapefruit', /grapefruit|peach|guava/],
  ['blueberry', /blueberr|blackberr|plum|grape\b/],
  ['lavender', /lavender|violet|butterfly/],
  ['orange', /orange|mango|apricot|passion|papaya/],
  ['lemon', /lemon|pineapple|pear|apple|banana/],
  ['lime', /lime|kiwi/],
  ['mint', /mint|basil|herb|thyme|rosemary|matcha|green tea/],
  ['cucumber', /cucumber|celery|elderflower/],
  ['honey', /honey|agave|vanilla|caramel/],
  ['cream', /milk|cream|yogurt|coconut|egg|aquafaba|half-and-half/],
  ['soda', /soda|tonic|water|ice|simple|seltzer|sparkling/],
]

// The swatch for a name such as "Blueberry syrup", or nothing when no word
// in it has a color.
export function colorFor(name: string): string | undefined {
  const words = name.toLowerCase()
  const match = COLOR_WORDS.find(([, rule]) => rule.test(words))?.[0]
  return PALETTE.find((swatch) => swatch.name === match)?.color
}
