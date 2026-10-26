// The curated Bar Terms: every bartending word the House Drinks use, with a
// plain definition of one or two sentences. Things you get ready before a
// Drink, such as syrups and cut garnishes, also say how to prepare them.

export const BAR_TERM_KINDS = ['method', 'technique', 'measure', 'tool', 'glass', 'ingredient'] as const
export type BarTermKind = (typeof BAR_TERM_KINDS)[number]

export interface BarTerm {
  id: string
  name: string
  kind: BarTermKind
  definition: string
  prep?: {
    heading: 'How to make it' | 'How to cut it' | 'How to do it'
    steps: string[]
  }
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
    prep: {
      heading: 'How to do it',
      steps: [
        'Cut a wide strip of peel with a vegetable peeler, taking as little of the bitter white pith as you can.',
        'Hold it skin side down a few inches above the drink, between your thumb and fingers.',
        'Squeeze it sharply so the oils spray across the top of the drink.',
        'Rub the skin around the rim if the recipe says to, then drop it in or rest it on the rim.',
      ],
    },
  },
  {
    id: 'rim',
    name: 'Rim',
    kind: 'technique',
    definition:
      'The top edge of a glass. A salted or sugared rim is a thin coat of salt or sugar stuck around the outside of that edge, so each sip picks some up.',
    prep: {
      heading: 'How to do it',
      steps: [
        'Spread the salt or sugar on a small plate in a thin, even layer.',
        'Run a citrus wedge around the outside edge of the glass to wet it.',
        'Hold the glass on its side and turn the wet edge through the salt, keeping it off the inside of the glass.',
        'Tap off any loose grains before you add the ice.',
      ],
    },
  },
  {
    id: 'roll',
    name: 'Roll',
    kind: 'technique',
    definition:
      'Pouring a drink back and forth between two shaker tins to mix and chill it gently. It suits thick drinks like tomato juice, which shaking would turn frothy.',
    prep: {
      heading: 'How to do it',
      steps: [
        'Put the drink in one tin and fill the other tin with ice.',
        'Pour the drink over the ice, then pour everything back into the first tin.',
        'Keep pouring from tin to tin, a few inches apart, 4 to 6 times until the tin feels cold.',
        'Strain it into the glass, leaving the old ice behind.',
      ],
    },
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
    prep: {
      heading: 'How to make it',
      steps: [
        'Heat 1 cup of water until hot but not boiling, then take it off the heat.',
        'Stir in 1 cup of white sugar until it dissolves and the syrup turns clear.',
        'Let it cool, then pour it into a clean jar with a lid.',
        'Keep it in the fridge for up to a month.',
      ],
    },
  },
  {
    id: 'demerara-syrup',
    name: 'Demerara syrup',
    kind: 'ingredient',
    definition: 'Simple syrup made with demerara, a light brown sugar, for a deeper, toffee-like sweetness.',
    prep: {
      heading: 'How to make it',
      steps: [
        'Heat 1 cup of water until hot but not boiling, then take it off the heat.',
        'Stir in 1 cup of demerara sugar until it dissolves. The bigger crystals take a little longer than white sugar.',
        'Let it cool, then pour it into a clean jar with a lid.',
        'Keep it in the fridge for up to a month.',
      ],
    },
  },
  {
    id: 'honey-syrup',
    name: 'Honey syrup',
    kind: 'ingredient',
    definition: 'Honey thinned with an equal amount of warm water so it mixes into cold drinks.',
    prep: {
      heading: 'How to make it',
      steps: [
        'Warm 1/2 cup of water until hot to the touch but not boiling.',
        'Stir in 1/2 cup of honey until the two are fully mixed.',
        'Let it cool, then pour it into a clean jar with a lid.',
        'Keep it in the fridge for up to 2 weeks.',
      ],
    },
  },
  {
    id: 'blueberry-syrup',
    name: 'Blueberry syrup',
    kind: 'ingredient',
    definition: 'Simple syrup cooked with blueberries, for a deep purple, fruity sweetness.',
    prep: {
      heading: 'How to make it',
      steps: [
        'Put 1 cup of blueberries, fresh or frozen, in a small pan with 1/2 cup of sugar and 1/2 cup of water.',
        'Simmer gently for about 10 minutes, pressing the berries with a spoon to burst them.',
        'Pour it through a fine strainer into a bowl, pressing the berries to get all the juice out.',
        'Let it cool, then keep it in a clean jar in the fridge for up to 2 weeks.',
      ],
    },
  },
  {
    id: 'cherry-syrup',
    name: 'Cherry syrup',
    kind: 'ingredient',
    definition: 'Simple syrup cooked with cherries, sweet and a little tart.',
    prep: {
      heading: 'How to make it',
      steps: [
        'Put 1 cup of pitted cherries, fresh or frozen, in a small pan with 1/2 cup of sugar and 1/2 cup of water.',
        'Simmer gently for about 10 minutes, mashing the cherries with a spoon as they soften.',
        'Pour it through a fine strainer into a bowl, pressing the fruit to get all the juice out.',
        'Let it cool, then keep it in a clean jar in the fridge for up to 2 weeks.',
      ],
    },
  },
  {
    id: 'chai-syrup',
    name: 'Chai syrup',
    kind: 'ingredient',
    definition: 'Simple syrup made with strong chai tea, so it tastes of warm spices like cinnamon, cardamom and ginger.',
    prep: {
      heading: 'How to make it',
      steps: [
        'Bring 1 cup of water to a boil, take it off the heat and add 2 chai tea bags.',
        'Steep for 10 minutes, then lift out the tea bags and squeeze them over the pan.',
        'Stir in 1 cup of sugar while the tea is still warm, until it dissolves.',
        'Let it cool, then keep it in a clean jar in the fridge for up to 2 weeks.',
      ],
    },
  },
  {
    id: 'cinnamon-syrup',
    name: 'Cinnamon syrup',
    kind: 'ingredient',
    definition: 'Simple syrup steeped with cinnamon sticks, for a warm, spiced sweetness.',
    prep: {
      heading: 'How to make it',
      steps: [
        'Put 1 cup of water, 1 cup of sugar and 3 cinnamon sticks, broken in half, in a small pan.',
        'Simmer gently for 5 minutes, stirring until the sugar dissolves.',
        'Take it off the heat and let it steep for 30 minutes. Leave it longer for a stronger flavor.',
        'Strain out the cinnamon, then keep the syrup in a clean jar in the fridge for up to 2 weeks.',
      ],
    },
  },
  {
    id: 'ginger-syrup',
    name: 'Ginger syrup',
    kind: 'ingredient',
    definition: 'Simple syrup made with fresh ginger, sweet with a spicy bite.',
    prep: {
      heading: 'How to make it',
      steps: [
        'Peel a piece of fresh ginger about the size of your thumb and slice it thinly.',
        'Simmer the ginger in 1 cup of water for 15 minutes, then take it off the heat.',
        'Stir in 1 cup of sugar until it dissolves, then let it cool.',
        'Strain out the ginger, then keep the syrup in a clean jar in the fridge for up to 2 weeks.',
      ],
    },
  },
  {
    id: 'lavender-syrup',
    name: 'Lavender syrup',
    kind: 'ingredient',
    definition: 'Simple syrup steeped with dried lavender, sweet and floral. A little goes a long way.',
    prep: {
      heading: 'How to make it',
      steps: [
        'Heat 1 cup of water and 1 cup of sugar in a small pan, stirring until the sugar dissolves.',
        'Take it off the heat and stir in 1 tablespoon of dried culinary lavender.',
        'Steep for 15 minutes, no longer, or it starts to taste of soap.',
        'Pour it through a fine strainer, let it cool, then keep it in a clean jar in the fridge for up to 2 weeks.',
      ],
    },
  },
  {
    id: 'raspberry-syrup',
    name: 'Raspberry syrup',
    kind: 'ingredient',
    definition: 'Simple syrup cooked with raspberries, bright pink, sweet and sharp.',
    prep: {
      heading: 'How to make it',
      steps: [
        'Put 1 cup of raspberries, fresh or frozen, in a small pan with 1/2 cup of sugar and 1/2 cup of water.',
        'Simmer gently for about 5 minutes, mashing the berries with a spoon as they soften.',
        'Pour it through a fine strainer into a bowl, pressing the fruit but leaving the seeds behind.',
        'Let it cool, then keep it in a clean jar in the fridge for up to 2 weeks.',
      ],
    },
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
    id: 'grenadine',
    name: 'Grenadine',
    kind: 'ingredient',
    definition:
      'A deep red syrup made from pomegranate juice and sugar, sweet and a little tart. Most bottled grenadine is only red-colored sugar syrup.',
    prep: {
      heading: 'How to make it',
      steps: [
        'Put 1 cup of pomegranate juice and 1 cup of sugar in a small pan.',
        'Warm it over low heat, stirring until the sugar dissolves, then simmer gently for 5 minutes without letting it boil.',
        'Take it off the heat and stir in a squeeze of lemon juice.',
        'Let it cool, then keep it in a clean jar in the fridge for up to 3 weeks.',
      ],
    },
  },
  {
    id: 'wheel',
    name: 'Wheel',
    kind: 'ingredient',
    definition: 'A thin round slice cut across a citrus fruit, used as a garnish.',
    prep: {
      heading: 'How to cut it',
      steps: [
        'Cut the two ends off the fruit.',
        'Slice across the fruit into rounds about 1/4 inch thick.',
        'To sit one on the rim, cut from the middle out through the peel on one side, then slide the cut onto the glass.',
      ],
    },
  },
  {
    id: 'wedge',
    name: 'Wedge',
    kind: 'ingredient',
    definition: 'A piece of citrus cut lengthways, to squeeze into the drink or perch on the rim.',
    prep: {
      heading: 'How to cut it',
      steps: [
        'Cut the two ends off the fruit.',
        'Cut it in half lengthways, from end to end.',
        'Lay each half flat side down and cut it lengthways into 3 or 4 wedges.',
        'To perch one on the rim, cut a short slit across the middle of the flesh and slide it onto the glass.',
      ],
    },
  },
]
