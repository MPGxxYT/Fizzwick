// The curated Bar Terms: every bartending word the House Drinks use, with a
// plain definition of one or two sentences.

export const BAR_TERM_KINDS = ['method', 'technique', 'measure', 'tool', 'glass', 'ingredient'] as const
export type BarTermKind = (typeof BAR_TERM_KINDS)[number]

export interface BarTerm {
  id: string
  name: string
  kind: BarTermKind
  definition: string
  // Words or phrases to find, each with its plural and verb forms. Defaults
  // to the name. A phrase's forms change only its last word.
  forms?: string[]
  // Match the exact case only, for words that are also everyday English.
  caseSensitive?: boolean
}

export const BAR_TERMS: BarTerm[] = [
  {
    id: 'build',
    name: 'Build',
    kind: 'method',
    forms: ['build', 'built'],
    definition: 'Making a drink straight in the glass you serve it in, adding each ingredient in turn. No shaker needed.',
  },
  {
    id: 'shake',
    name: 'Shake',
    kind: 'method',
    forms: ['shake', 'shaken', 'shook'],
    definition:
      'Shaking the ingredients hard with ice in a sealed shaker tin. It chills and mixes the drink, adds a little water, and whips in air.',
  },
  {
    id: 'stir',
    name: 'Stir',
    kind: 'method',
    definition: 'Stirring a drink with ice using a barspoon, smoothly and without splashing. It chills and mixes without adding air.',
  },
  {
    id: 'blend',
    name: 'Blend',
    kind: 'method',
    definition: 'Running the ingredients with ice in a blender until smooth, for frozen drinks.',
  },
  {
    id: 'dry-shake',
    name: 'Dry shake',
    kind: 'method',
    forms: ['dry shake', 'dry shaken'],
    definition:
      'Shaking without ice first, to whip egg white or aquafaba into a thick foam. You then shake again with ice to chill it.',
  },
  {
    id: 'muddle',
    name: 'Muddle',
    kind: 'technique',
    definition:
      'Pressing fruit or herbs with a muddler to release their juice and oils. Herbs need only a gentle press, since grinding them makes them bitter.',
  },
  {
    id: 'strain',
    name: 'Strain',
    kind: 'technique',
    definition: 'Pouring a drink through a strainer so the ice and any bits stay behind.',
  },
  {
    id: 'fine-strain',
    name: 'Fine strain',
    kind: 'technique',
    definition: 'Straining through a fine mesh strainer to catch seeds, pulp and chips of ice, so the drink comes out smooth.',
  },
  {
    id: 'double-strain',
    name: 'Double strain',
    kind: 'technique',
    definition: "Straining through the shaker's strainer and a fine strainer at the same time, for an extra smooth drink.",
  },
  {
    id: 'express',
    name: 'Express',
    kind: 'technique',
    definition:
      'Squeezing a strip of citrus peel, skin side down, over a drink so its oils spray across the top. It adds a strong citrus smell.',
  },
  {
    id: 'float',
    name: 'Float',
    kind: 'technique',
    definition: 'Laying something gently on the surface of a drink so it rests on top instead of sinking or mixing in.',
  },
  {
    id: 'churn',
    name: 'Churn',
    kind: 'technique',
    definition: 'Plunging a barspoon down through crushed ice and lifting it back up, to mix the drink through the ice.',
  },
  {
    id: 'slap',
    name: 'Slap',
    kind: 'technique',
    definition: 'Clapping a herb sprig between your palms to bruise it lightly and wake up its smell before it goes in the glass.',
  },
  {
    id: 'garnish',
    name: 'Garnish',
    kind: 'technique',
    definition: 'Something added to the glass at the end, such as a citrus wheel or a herb sprig, for its smell and looks.',
  },
  {
    id: 'mise-en-place',
    name: 'Mise en Place',
    kind: 'technique',
    definition: 'French for "put in place": setting out the glass, tools and ingredients before you start.',
  },
  {
    id: 'top',
    name: 'Top',
    kind: 'measure',
    // Only the capitalised measure, so "the top of the glass" is left alone.
    caseSensitive: true,
    definition: 'Fill the rest of the glass with this, usually something fizzy. There is no fixed amount.',
  },
  {
    id: 'dash',
    name: 'Dash',
    kind: 'measure',
    definition: 'A few drops, about an eighth of a teaspoon, shaken from a bottle with a dasher top.',
  },
  {
    id: 'barspoon',
    name: 'Barspoon',
    kind: 'tool',
    definition: 'A long, thin spoon for stirring drinks. As a measure, one barspoon is about a teaspoon.',
  },
  {
    id: 'jigger',
    name: 'Jigger',
    kind: 'tool',
    definition: 'A small double-ended measuring cup for pouring exact amounts, usually with one end bigger than the other.',
  },
  {
    id: 'shaker',
    name: 'Shaker tin',
    kind: 'tool',
    forms: ['shaker tin', 'shaker'],
    definition: 'A metal tin for shaking drinks, sealed with a second, smaller tin or a cap.',
  },
  {
    id: 'strainer',
    name: 'Strainer',
    kind: 'tool',
    definition: 'A flat strainer with a spring around its edge. It sits over a shaker tin or mixing glass to hold back the ice.',
  },
  {
    id: 'fine-strainer',
    name: 'Fine strainer',
    kind: 'tool',
    definition: 'A small cone-shaped mesh sieve, held under the main strainer to catch seeds, pulp and chips of ice.',
  },
  {
    id: 'mixing-glass',
    name: 'Mixing glass',
    kind: 'tool',
    definition: 'A large, sturdy glass with a pouring lip, for stirring drinks with ice.',
  },
  {
    id: 'muddler',
    name: 'Muddler',
    kind: 'tool',
    definition: 'A short, blunt stick for pressing fruit and herbs.',
  },
  {
    id: 'collins-glass',
    name: 'Collins glass',
    kind: 'glass',
    definition: 'A tall, narrow glass of about 12 oz, for long fizzy drinks over ice.',
  },
  {
    id: 'highball-glass',
    name: 'Highball glass',
    kind: 'glass',
    definition: 'A tall glass of about 10 oz, a little shorter and wider than a Collins glass.',
  },
  {
    id: 'rocks-glass',
    name: 'Rocks glass',
    kind: 'glass',
    definition: 'A short, wide glass of about 8 oz, for drinks over ice. Also called an old fashioned glass.',
  },
  {
    id: 'coupe',
    name: 'Coupe',
    kind: 'glass',
    definition: 'A shallow, wide bowl on a stem, about 6 oz, for drinks served cold without ice.',
  },
  {
    id: 'hurricane-glass',
    name: 'Hurricane glass',
    kind: 'glass',
    definition: 'A tall, curvy glass of about 15 oz, shaped like an old hurricane lamp, for frozen and tropical drinks.',
  },
  {
    id: 'simple-syrup',
    name: 'Simple syrup',
    kind: 'ingredient',
    definition: "Sugar dissolved in an equal amount of hot water, then cooled. It mixes into cold drinks where plain sugar won't.",
  },
  {
    id: 'demerara-syrup',
    name: 'Demerara syrup',
    kind: 'ingredient',
    definition: 'Simple syrup made with demerara, a light brown sugar, for a deeper, toffee-like sweetness.',
  },
  {
    id: 'honey-syrup',
    name: 'Honey syrup',
    kind: 'ingredient',
    definition: 'Honey thinned with an equal amount of warm water so it mixes into cold drinks.',
  },
  {
    id: 'bitters',
    name: 'Bitters',
    kind: 'ingredient',
    forms: ['bitters'],
    definition:
      'A strong extract of herbs, roots and spices, used a few dashes at a time. The ones in Fizzwick drinks are alcohol-free.',
  },
  {
    id: 'aquafaba',
    name: 'Aquafaba',
    kind: 'ingredient',
    definition: 'The liquid from a can of chickpeas. It whips into a foam like egg white and tastes of almost nothing.',
  },
  {
    id: 'wheel',
    name: 'Wheel',
    kind: 'ingredient',
    definition: 'A thin round slice cut across a citrus fruit, used as a garnish.',
  },
  {
    id: 'wedge',
    name: 'Wedge',
    kind: 'ingredient',
    definition: 'A piece of citrus cut lengthways, to squeeze into the drink or perch on the rim.',
  },
]
