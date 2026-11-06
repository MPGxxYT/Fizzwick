import { readdirSync, readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { closeFilters, openFilters } from './filters.ts'

test('the menu opens the other pages, and the heart stays outside it', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Favorites' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Bar Terms explained' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'New drink' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Menu' }).click()
  const menu = page.getByRole('dialog', { name: 'Menu' })
  await expect(menu.getByRole('link')).toHaveText(['My Bar', 'New drink', 'Bar Terms', 'Settings'])
  await menu.getByRole('button', { name: 'Close' }).click()
  await expect(menu).toHaveCount(0)

  for (const name of ['My Bar', 'New drink', 'Bar Terms', 'Settings']) {
    await page.goto('/')
    await page.getByRole('button', { name: 'Menu' }).click()
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name }).click()
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible()
  }
})

test('the home page lists the House Drinks and opens one', async ({ page }) => {
  await page.goto('/')
  const card = page.getByRole('link', { name: /Cherry Limeade/ })
  await expect(card).toContainText('Build, Collins glass')
  await expect(card).toContainText('citrus, fruity')
  await card.click()
  await expect(page.getByRole('heading', { name: 'Cherry Limeade' })).toBeVisible()
})

test('search finds a Drink by an ingredient that only appears in an Option', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('searchbox', { name: 'Search drinks or ingredients' }).fill('sparkling limeade')
  await expect(page.getByRole('link', { name: /Cherry Limeade/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Raspberry Lime Rickey/ })).toBeVisible()
  await expect(page.getByText('2 drinks', { exact: true })).toBeVisible()
})

test('a search with no matches says so and can be cleared', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('searchbox', { name: 'Search drinks or ingredients' }).fill('durian')
  await expect(page.getByText('No drinks match "durian"')).toBeVisible()
  await expect(page.getByRole('link', { name: /Cherry Limeade/ })).toHaveCount(0)

  await page.getByRole('button', { name: 'Clear search and filters' }).click()
  await expect(page.getByRole('link', { name: /Cherry Limeade/ })).toBeVisible()
  await expect(page.getByRole('searchbox', { name: 'Search drinks or ingredients' })).toHaveValue('')
})

test('filters toggle on and off, and the list keeps them after visiting a Drink', async ({ page }) => {
  await page.goto('/')
  const build = (await openFilters(page)).getByRole('group', { name: 'Method' }).getByRole('button', { name: 'Build' })
  await build.click()
  await expect(build).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/method=build/)
  await closeFilters(page)
  await expect(page.getByRole('button', { name: 'Filters, 1 on' })).toBeVisible()

  await page.getByRole('link', { name: /Cherry Limeade/ }).click()
  await page.getByRole('link', { name: 'All drinks' }).click()
  const on = page.getByRole('group', { name: 'Filters on' })
  await expect(on.getByRole('button', { name: 'Turn off Build' })).toBeVisible()
  await openFilters(page)
  await expect(build).toHaveAttribute('aria-pressed', 'true')
  await closeFilters(page)

  await on.getByRole('button', { name: 'Turn off Build' }).click()
  await expect(page).not.toHaveURL(/method=/)
  await expect(on).toHaveCount(0)
})

test('opening a Drink from far down the list starts at the top, and going back returns to the same spot', async ({
  page,
}) => {
  const scrollY = () => page.evaluate<number>('window.scrollY')
  await page.goto('/')
  const last = page.getByRole('listitem').filter({ hasText: 'Tea Sour' })
  await last.scrollIntoViewIfNeeded()
  const listY = await scrollY()
  expect(listY).toBeGreaterThan(500)

  await last.getByRole('link').click()
  await expect(page.getByRole('heading', { name: 'Tea Sour' })).toBeVisible()
  expect(await scrollY()).toBe(0)

  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Fizzwick' })).toBeVisible()
  await expect.poll(scrollY).toBeGreaterThan(listY - 50)
})

test('the tool filter keeps Drinks you can make, opened on a Riff that fits', async ({ page }) => {
  await page.goto('/')
  await (await openFilters(page)).getByRole('group', { name: 'What you have' }).getByRole('button', { name: 'Tools' }).click()
  const tools = page.getByRole('dialog', { name: 'Tools you have' })
  await expect(tools.getByRole('button', { name: 'Kettle' })).toHaveCount(0)
  await expect(tools.getByRole('button', { name: 'Peeler' })).toHaveCount(0)
  await expect(tools.getByRole('button', { name: 'Mixing glass' })).toHaveCount(0)
  await tools.getByRole('button', { name: 'Jigger' }).click()
  await tools.getByRole('button', { name: 'Blender' }).click()
  await tools.getByRole('button', { name: 'Close' }).click()

  // Closing Tools goes back to the Filters sheet.
  await expect(page.getByRole('group', { name: 'What you have' }).getByRole('button', { name: '2 tools' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await closeFilters(page)
  // Garden Smash always needs a muddler; Nada Colada blends instead of shaking.
  await expect(page.getByRole('link', { name: /Garden Smash/ })).toHaveCount(0)
  // Citrus Spritz wants a peeler, and a knife does that.
  await expect(page.getByRole('link', { name: /Citrus Spritz/ })).not.toContainText('With')
  const colada = page.getByRole('link', { name: /Nada Colada/ })
  await expect(colada).toContainText('With blended with ice')
  await colada.click()
  await expect(page).toHaveURL(/\/drinks\/nada-colada\/.*=blended/)
})

test('the ingredient filter finds every Drink that can use what you made', async ({ page }) => {
  await page.goto('/')
  await (await openFilters(page)).getByRole('group', { name: 'What you have' }).getByRole('button', { name: 'Ingredients' }).click()
  const sheet = page.getByRole('dialog', { name: 'Ingredients' })
  await sheet.getByRole('searchbox', { name: 'Search ingredients' }).fill('raspberr')
  await sheet.getByRole('button', { name: 'Raspberry syrup' }).click()
  await sheet.getByRole('button', { name: 'Raspberries', exact: true }).click()
  await sheet.getByRole('button', { name: 'Close' }).click()
  await closeFilters(page)

  await expect(page.getByText('4 drinks', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /Nojito/ })).toContainText('With muddled raspberries')
})

test('the ingredient filter lists things you buy, not recipe wordings', async ({ page }) => {
  await page.goto('/')
  await (await openFilters(page)).getByRole('group', { name: 'What you have' }).getByRole('button', { name: 'Ingredients' }).click()
  const sheet = page.getByRole('dialog', { name: 'Ingredients' })
  await expect(sheet.getByRole('button', { name: 'Ice', exact: true })).toHaveCount(1)
  await expect(sheet.getByRole('button', { name: 'Crushed ice' })).toHaveCount(0)
  await expect(sheet.getByRole('button', { name: 'Cold water' })).toHaveCount(0)
  await expect(sheet.getByRole('button', { name: 'Lemon wheel' })).toHaveCount(0)
  await expect(sheet.getByRole('region', { name: 'Garnishes' }).getByRole('button', { name: 'Pickles' })).toBeVisible()

  await sheet.getByRole('searchbox', { name: 'Search ingredients' }).fill('lemon peel')
  await sheet.getByRole('button', { name: 'Lemons' }).click()
  await sheet.getByRole('button', { name: 'Close' }).click()
  await expect(page).toHaveURL(/ing=lemons/)
  await expect(page.getByRole('group', { name: 'What you have' }).getByRole('button', { name: 'Lemons' })).toBeVisible()
  await closeFilters(page)
  await expect(page.getByRole('group', { name: 'Filters on' }).getByRole('button', { name: 'Turn off Lemons' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Tea Sour/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Porch Tea/ })).toBeVisible()
})

test('a syrup Bar Term links to the Drinks that use it', async ({ page }) => {
  await page.goto('/bar-terms#raspberry-syrup')
  await page.getByRole('link', { name: 'Drinks that use it' }).click()
  await expect(page).toHaveURL(/\/\?ing=raspberry-syrup/)
  await expect(page.getByRole('link', { name: /Italian Soda/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Raspberry Clover/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Raspberry Lime Rickey/ })).toBeVisible()
  await expect(page.getByText('3 drinks', { exact: true })).toBeVisible()
})

test('the Wheel Bar Term finds wheels, not every Drink with the same fruit', async ({ page }) => {
  await page.goto('/bar-terms#wheel')
  await page.getByRole('link', { name: 'Drinks that use it' }).click()
  await expect(page).toHaveURL(/ing=lime\+wheel/)
  await expect(page.getByRole('link', { name: /Hibiscus Stir/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Tea Sour/ })).toHaveCount(0)
})

test('the Drinks sit on Shelves, and the Shelf strip jumps to one', async ({ page }) => {
  await page.goto('/')
  const smashes = page.getByRole('region', { name: 'Smashes' })
  await expect(smashes.getByRole('link')).toHaveCount(5)
  await expect(smashes.getByRole('link', { name: /Nojito/ })).toBeVisible()

  const strip = page.getByRole('navigation', { name: 'Shelves' })
  await strip.getByRole('button', { name: 'Warm & savory' }).click()
  await expect(page.getByRole('region', { name: 'Warm & savory' }).getByRole('link', { name: /Ginger Toddy/ })).toBeInViewport()
  await expect(strip.getByRole('button', { name: 'Warm & savory' })).toHaveAttribute('aria-current', 'true')

  // A filter leaves out the Shelves with nothing on them.
  await page.goto('/?method=blend')
  await expect(page.getByRole('region', { name: 'Smashes' })).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Creamy & frozen' })).toBeVisible()
})

// The House Drinks added last, by their files' added dates.
function latestBatch() {
  const dir = 'src/house-drinks'
  const drinks = readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(readFileSync(`${dir}/${file}`, 'utf8')) as { name: string; added: string })
  const latest = drinks.map((drink) => drink.added).sort().at(-1) ?? ''
  return { latest, names: drinks.filter((drink) => drink.added === latest).map((drink) => drink.name) }
}

test('the latest batch of House Drinks is marked New, until 30 days after', async ({ page }) => {
  const { latest, names } = latestBatch()
  await page.clock.setFixedTime(new Date(`${latest}T12:00:00`))
  await page.goto('/')
  const marked = page.getByRole('listitem').filter({ has: page.getByText('New', { exact: true }) })
  await expect(marked).toHaveCount(names.length)
  for (const name of names) await expect(marked.filter({ hasText: name })).toHaveCount(1)

  const later = new Date(`${latest}T12:00:00`)
  later.setDate(later.getDate() + 30)
  await page.clock.setFixedTime(later)
  await page.reload()
  await expect(page.getByRole('link', { name: /Cherry Limeade/ })).toBeVisible()
  await expect(page.getByText('New', { exact: true })).toHaveCount(0)
})
