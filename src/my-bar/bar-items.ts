// Groups for browsing Bar Items, in the order they're shown.
export const BAR_GROUPS = [
  'Syrups and sweeteners',
  'Juices',
  'Fruit and vegetables',
  'Herbs, spices and bitters',
  'Milk, cream and egg',
  'Tea and coffee',
  'Sodas and tonics',
  'Ice',
  'Garnishes',
] as const
export type BarGroup = (typeof BAR_GROUPS)[number]

// Something you'd buy or make once, such as Lemons, and the recipe wordings
// it stands for. `covers` names are needed to make a Drink. `garnishes` names
// only dress one, so they never stop you making it. An item with only
// garnishes is left off My Bar and stays in the Ingredients filter.
export interface BarItem {
  id: string
  label: string
  group: BarGroup
  covers: string[]
  garnishes?: string[]
}

const syrup = (label: string, name = label.toLowerCase()): BarItem => ({
  id: name.replaceAll(' ', '-'),
  label,
  group: 'Syrups and sweeteners',
  covers: [name],
})

const garnish = (id: string, label: string, ...garnishes: string[]): BarItem => ({
  id,
  label,
  group: 'Garnishes',
  covers: [],
  garnishes,
})

export const BAR_ITEMS: readonly BarItem[] = [
  syrup('Simple syrup'),
  syrup('Demerara syrup'),
  syrup('Honey syrup'),
  syrup('Honey'),
  syrup('Agave'),
  syrup('Maple syrup'),
  syrup('Grenadine'),
  syrup('Blueberry syrup'),
  syrup('Chai syrup'),
  syrup('Cherry syrup'),
  syrup('Cinnamon syrup'),
  syrup('Ginger syrup'),
  syrup('Lavender syrup'),
  syrup('Raspberry syrup'),
  syrup('Strawberry syrup'),
  syrup('Vanilla syrup'),

  { id: 'apple-juice', label: 'Apple juice', group: 'Juices', covers: ['cloudy apple juice'] },
  { id: 'blood-orange-juice', label: 'Blood orange juice', group: 'Juices', covers: ['blood orange juice'] },
  { id: 'cranberry-juice', label: 'Cranberry juice', group: 'Juices', covers: ['cranberry juice', 'unsweetened cranberry juice'] },
  { id: 'passion-fruit-puree', label: 'Passion fruit purée', group: 'Juices', covers: ['passion fruit purée'] },
  { id: 'pear-juice', label: 'Pear juice', group: 'Juices', covers: ['pear juice'] },
  { id: 'pineapple-juice', label: 'Pineapple juice', group: 'Juices', covers: ['pineapple juice'] },
  { id: 'pomegranate-juice', label: 'Pomegranate juice', group: 'Juices', covers: ['pomegranate juice'] },
  { id: 'tart-cherry-juice', label: 'Tart cherry juice', group: 'Juices', covers: ['tart cherry juice'] },
  { id: 'tomato-juice', label: 'Tomato juice', group: 'Juices', covers: ['tomato juice'] },

  {
    id: 'lemons',
    label: 'Lemons',
    group: 'Fruit and vegetables',
    covers: ['fresh lemon juice'],
    garnishes: ['lemon peel', 'lemon wedge', 'lemon wheel'],
  },
  {
    id: 'limes',
    label: 'Limes',
    group: 'Fruit and vegetables',
    covers: ['fresh lime juice'],
    garnishes: ['lime wedge', 'lime wheel'],
  },
  {
    id: 'grapefruits',
    label: 'Grapefruits',
    group: 'Fruit and vegetables',
    covers: ['fresh grapefruit juice'],
    garnishes: ['grapefruit peel', 'grapefruit wedge'],
  },
  { id: 'blackberries', label: 'Blackberries', group: 'Fruit and vegetables', covers: ['blackberries'] },
  {
    id: 'blueberries',
    label: 'Blueberries',
    group: 'Fruit and vegetables',
    covers: ['fresh blueberries'],
    garnishes: ['blueberries, on a cocktail pick'],
  },
  { id: 'fresh-cherries', label: 'Fresh cherries', group: 'Fruit and vegetables', covers: ['fresh cherries, pitted'] },
  {
    id: 'cucumbers',
    label: 'Cucumbers',
    group: 'Fruit and vegetables',
    covers: ['cucumber slices', 'long cucumber ribbons', 'thin cucumber slices'],
  },
  { id: 'mango', label: 'Mango', group: 'Fruit and vegetables', covers: ['chopped ripe mango', 'frozen mango', 'frozen mango chunks'] },
  {
    id: 'raspberries',
    label: 'Raspberries',
    group: 'Fruit and vegetables',
    covers: ['raspberries'],
    garnishes: ['raspberries on a pick'],
  },
  {
    id: 'strawberries',
    label: 'Strawberries',
    group: 'Fruit and vegetables',
    covers: ['frozen strawberries'],
    garnishes: ['fresh strawberry'],
  },
  {
    id: 'watermelon',
    label: 'Watermelon',
    group: 'Fruit and vegetables',
    covers: ['seedless watermelon chunks', 'watermelon juice', 'watermelon, cubed'],
  },

  {
    id: 'mint',
    label: 'Mint',
    group: 'Herbs, spices and bitters',
    covers: ['mint leaves'],
    garnishes: ['mint sprig', 'mint sprig, for garnish'],
  },
  {
    id: 'basil',
    label: 'Basil',
    group: 'Herbs, spices and bitters',
    covers: ['basil leaves'],
    garnishes: ['basil sprig', 'basil sprig, for garnish'],
  },
  {
    id: 'thyme',
    label: 'Thyme',
    group: 'Herbs, spices and bitters',
    covers: ['thyme sprigs'],
    garnishes: ['thyme sprig, for garnish'],
  },
  { id: 'bitters', label: 'Alcohol-free bitters', group: 'Herbs, spices and bitters', covers: ['alcohol-free aromatic bitters'] },
  { id: 'black-pepper', label: 'Black pepper', group: 'Herbs, spices and bitters', covers: ['ground black pepper'] },
  { id: 'cardamom', label: 'Cardamom', group: 'Herbs, spices and bitters', covers: ['ground cardamom'] },
  { id: 'celery-salt', label: 'Celery salt', group: 'Herbs, spices and bitters', covers: ['celery salt'] },
  {
    id: 'cinnamon',
    label: 'Cinnamon',
    group: 'Herbs, spices and bitters',
    covers: ['ground cinnamon'],
    garnishes: ['cinnamon stick'],
  },
  { id: 'flaky-sea-salt', label: 'Flaky sea salt', group: 'Herbs, spices and bitters', covers: ['flaky sea salt'] },
  { id: 'horseradish', label: 'Horseradish', group: 'Herbs, spices and bitters', covers: ['prepared horseradish'] },
  { id: 'hot-sauce', label: 'Hot sauce', group: 'Herbs, spices and bitters', covers: ['hot sauce'] },
  { id: 'smoked-salt', label: 'Smoked salt', group: 'Herbs, spices and bitters', covers: ['smoked salt'] },
  { id: 'tajin', label: 'Tajín', group: 'Herbs, spices and bitters', covers: ['tajín chili-lime seasoning'] },
  { id: 'vanilla-extract', label: 'Vanilla extract', group: 'Herbs, spices and bitters', covers: ['drops of vanilla extract'] },

  { id: 'whole-milk', label: 'Whole milk', group: 'Milk, cream and egg', covers: ['whole milk'] },
  { id: 'half-and-half', label: 'Half-and-half', group: 'Milk, cream and egg', covers: ['half-and-half'] },
  { id: 'almond-milk', label: 'Almond milk', group: 'Milk, cream and egg', covers: ['almond milk'] },
  { id: 'oat-milk', label: 'Oat milk', group: 'Milk, cream and egg', covers: ['oat milk'] },
  { id: 'coconut-milk', label: 'Coconut milk', group: 'Milk, cream and egg', covers: ['coconut milk'] },
  { id: 'coconut-cream', label: 'Coconut cream', group: 'Milk, cream and egg', covers: ['coconut cream'] },
  { id: 'yogurt', label: 'Yogurt', group: 'Milk, cream and egg', covers: ['plain whole-milk yogurt'] },
  { id: 'coconut-yogurt', label: 'Coconut yogurt', group: 'Milk, cream and egg', covers: ['plain coconut yogurt'] },
  { id: 'eggs', label: 'Eggs', group: 'Milk, cream and egg', covers: ['egg white'] },
  { id: 'aquafaba', label: 'Aquafaba', group: 'Milk, cream and egg', covers: ['aquafaba'] },

  { id: 'black-tea', label: 'Black tea', group: 'Tea and coffee', covers: ['chilled black tea', 'chilled strong black tea'] },
  { id: 'green-tea', label: 'Green tea', group: 'Tea and coffee', covers: ['chilled green tea'] },
  { id: 'hibiscus-tea', label: 'Hibiscus tea', group: 'Tea and coffee', covers: ['chilled hibiscus tea', 'chilled strong hibiscus tea'] },
  { id: 'lapsang-souchong', label: 'Lapsang souchong', group: 'Tea and coffee', covers: ['chilled lapsang souchong'] },
  { id: 'rooibos', label: 'Rooibos', group: 'Tea and coffee', covers: ['chilled rooibos', 'rooibos tea bag'] },
  { id: 'chamomile', label: 'Chamomile', group: 'Tea and coffee', covers: ['chamomile tea bag'] },
  { id: 'cold-brew', label: 'Cold brew', group: 'Tea and coffee', covers: ['cold brew coffee', 'cold brew concentrate'] },
  { id: 'espresso', label: 'Espresso', group: 'Tea and coffee', covers: ['espresso, cooled a little'] },

  { id: 'soda-water', label: 'Soda water', group: 'Sodas and tonics', covers: ['soda water'] },
  { id: 'tonic-water', label: 'Tonic water', group: 'Sodas and tonics', covers: ['tonic', 'tonic water'] },
  { id: 'elderflower-tonic', label: 'Elderflower tonic', group: 'Sodas and tonics', covers: ['elderflower tonic'] },
  { id: 'ginger-ale', label: 'Ginger ale', group: 'Sodas and tonics', covers: ['ginger ale'] },
  { id: 'ginger-beer', label: 'Ginger beer', group: 'Sodas and tonics', covers: ['ginger beer'] },
  { id: 'grapefruit-soda', label: 'Grapefruit soda', group: 'Sodas and tonics', covers: ['grapefruit soda'] },
  { id: 'lemon-lime-soda', label: 'Lemon-lime soda', group: 'Sodas and tonics', covers: ['lemon-lime soda'] },
  { id: 'sparkling-apple-cider', label: 'Sparkling apple cider', group: 'Sodas and tonics', covers: ['sparkling apple cider'] },
  { id: 'sparkling-lemonade', label: 'Sparkling lemonade', group: 'Sodas and tonics', covers: ['sparkling lemonade'] },
  { id: 'sparkling-limeade', label: 'Sparkling limeade', group: 'Sodas and tonics', covers: ['sparkling limeade'] },

  { id: 'ice', label: 'Ice', group: 'Ice', covers: ['crushed ice', 'ice', 'ice cubes', 'large ice cube'] },

  garnish('apples', 'Apples', 'thin apple slice'),
  garnish('candied-ginger', 'Candied ginger', 'candied ginger'),
  garnish('celery', 'Celery', 'celery stalk'),
  garnish('cocktail-cherries', 'Cocktail cherries', 'cherry', 'cocktail cherry'),
  garnish('cloves', 'Cloves', 'whole cloves'),
  garnish('coconut-flakes', 'Coconut flakes', 'toasted coconut flakes'),
  garnish('lavender', 'Lavender', 'lavender sprig'),
  garnish('nutmeg', 'Nutmeg', 'grated nutmeg'),
  garnish('oranges', 'Oranges', 'orange peel', 'orange wheel'),
  garnish('pears', 'Pears', 'thin pear slice'),
  garnish('pickles', 'Pickles', 'pickle spear'),
  garnish('pineapple', 'Pineapple', 'pineapple wedge'),
  garnish('rosemary', 'Rosemary', 'rosemary sprig'),
]

// Names nobody has to buy: water from the tap or kettle, and more of a
// sweetener the Drink already asks for.
export const ALWAYS_ON_HAND: readonly string[] = ['cold water', 'just-boiled water', 'extra sweetener, to balance the lemon']

export const namesOf = (item: BarItem) => [...item.covers, ...(item.garnishes ?? [])]

const byId = new Map(BAR_ITEMS.map((item) => [item.id, item]))
const byName = new Map(BAR_ITEMS.flatMap((item) => namesOf(item).map((name) => [name, item])))

export const barItemById = (id: string) => byId.get(id)
export const barItemFor = (name: string) => byName.get(name.toLowerCase())
export const isAlwaysOnHand = (name: string) => ALWAYS_ON_HAND.includes(name.toLowerCase())
