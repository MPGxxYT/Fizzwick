import { parseDrinkFile, type Drink } from '../riff-engine'

// Every House Drink, bundled at build time. CI already rejects broken files,
// so a parse failure here means a bad build and should fail loudly.
const files = import.meta.glob<unknown>('./*.json', { eager: true, import: 'default' })

export const houseDrinks: Drink[] = Object.entries(files)
  .map(([path, contents]) => {
    const result = parseDrinkFile(contents)
    if (!result.ok) throw new Error(`${path}:\n${result.errors.join('\n')}`)
    return result.drink
  })
  .sort((a, b) => a.name.localeCompare(b.name))

export function findHouseDrink(id: string): Drink | undefined {
  return houseDrinks.find((drink) => drink.id === id)
}
