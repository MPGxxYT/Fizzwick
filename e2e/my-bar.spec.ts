import { expect, test, type Page } from '@playwright/test'

// Enough for a Cherry Limeade with soda water.
async function tickCherryLimeade(page: Page) {
  for (const name of ['Jigger', 'Limes', 'Cherry syrup', 'Simple syrup', 'Soda water', 'Ice']) {
    await page.getByRole('button', { name, exact: true }).click()
  }
}

const canMake = (page: Page) => page.getByRole('group', { name: 'What you have' }).getByRole('button', { name: 'Can make' })

// A My Bar already ticked, as if saved on an earlier visit.
async function seedMyBar(page: Page, tools: string[], items: string[]) {
  await page.addInitScript(
    (saved) => {
      if (!localStorage.getItem('fizzwick.my-bar')) localStorage.setItem('fizzwick.my-bar', saved)
    },
    JSON.stringify({ tools, items }),
  )
}

test('an empty My Bar offers the link to the page instead of the toggle', async ({ page }) => {
  await page.goto('/')
  await expect(canMake(page)).toHaveCount(0)
  await page.getByRole('link', { name: 'Set up My Bar' }).click()
  await expect(page.getByRole('heading', { name: 'My Bar', level: 1 })).toBeVisible()
  await page.getByRole('button', { name: 'Ice', exact: true }).click()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(canMake(page)).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('link', { name: 'Set up My Bar' })).toHaveCount(0)
})

test('Can make stays on after a reload, stays out of the address, and shows only Drinks that fit', async ({ page }) => {
  await seedMyBar(page, ['jigger'], ['limes', 'cherry-syrup', 'simple-syrup', 'soda-water', 'ice'])
  await page.goto('/')
  await expect(page.getByRole('link', { name: /Tea Sour/ })).toBeVisible()

  await canMake(page).click()
  await expect(canMake(page)).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('link', { name: /Cherry Limeade/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Tea Sour/ })).toHaveCount(0)
  await expect(page).toHaveURL(/\/$/)

  await page.reload()
  await expect(canMake(page)).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('link', { name: /Tea Sour/ })).toHaveCount(0)

  await canMake(page).click()
  await expect(page.getByRole('link', { name: /Tea Sour/ })).toBeVisible()
})

test('a Drink whose House Spec needs a missing item opens on a Riff that fits', async ({ page }) => {
  await seedMyBar(page, ['jigger'], ['limes', 'tart-cherry-juice', 'simple-syrup', 'soda-water', 'ice'])
  await page.goto('/')
  await canMake(page).click()
  const card = page.getByRole('link', { name: /Cherry Limeade/ })
  await expect(card).toContainText('With tart cherry juice')
  await card.click()
  await expect(page).toHaveURL(/\/drinks\/cherry-limeade\/.*tart-cherry-juice/)
})

test('a missing fixed garnish does not hide a Drink', async ({ page }) => {
  // Hibiscus Stir's House Spec is garnished with orange peel, and Oranges can't be ticked.
  await seedMyBar(page, ['jigger'], ['hibiscus-tea', 'honey-syrup', 'limes', 'bitters', 'ice'])
  await page.goto('/')
  await canMake(page).click()
  const card = page.getByRole('link', { name: /Hibiscus Stir/ })
  await expect(card).toBeVisible()
  await expect(card).not.toContainText('With')
})

test('a My Bar that makes nothing yet says so and links to the page', async ({ page }) => {
  await seedMyBar(page, [], ['ice'])
  await page.goto('/')
  await canMake(page).click()
  await expect(page.getByText("My Bar doesn't make a drink yet.")).toBeVisible()
  await page.getByRole('link', { name: 'Open My Bar' }).click()
  await expect(page.getByRole('heading', { name: 'My Bar', level: 1 })).toBeVisible()
})

test('clearing filters resets only the temporary ones', async ({ page }) => {
  await seedMyBar(page, ['jigger'], ['limes', 'cherry-syrup', 'simple-syrup', 'soda-water', 'ice'])
  await page.goto('/')
  await canMake(page).click()
  await page.getByRole('searchbox', { name: 'Search drinks or ingredients' }).fill('durian')
  await expect(page.getByText('No drinks match "durian" from My Bar.')).toBeVisible()
  await page.getByRole('button', { name: 'Clear search and filters' }).click()
  await expect(page.getByRole('searchbox', { name: 'Search drinks or ingredients' })).toHaveValue('')
  await expect(canMake(page)).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('link', { name: /Tea Sour/ })).toHaveCount(0)
})

test('with Can make on, the swap sheet marks what is not in My Bar, and it can still be picked', async ({ page }) => {
  await seedMyBar(page, ['jigger'], ['limes', 'cherry-syrup', 'simple-syrup', 'soda-water', 'ice'])
  await page.goto('/')
  await canMake(page).click()
  await page.getByRole('link', { name: /Cherry Limeade/ }).click()

  await page.getByRole('button', { name: /^Sweetener:/ }).click()
  const sheet = page.getByRole('dialog', { name: 'Choose sweetener' })
  await expect(sheet.getByRole('button', { name: /Agave/ })).toContainText('Not in My Bar')
  await expect(sheet.getByRole('button', { name: /Simple syrup/ })).not.toContainText('Not in My Bar')

  await sheet.getByRole('button', { name: /Agave/ }).click()
  await expect(page).toHaveURL(/sweetener=agave/)

})

test('an Option is marked for a missing tool, with its ingredients ticked', async ({ page }) => {
  await seedMyBar(page, ['jigger'], ['limes', 'cherry-syrup', 'fresh-cherries', 'simple-syrup', 'soda-water', 'ice'])
  await page.goto('/')
  await canMake(page).click()
  await page.getByRole('link', { name: /Cherry Limeade/ }).click()
  await page.getByRole('button', { name: /^Cherry:/ }).click()
  await expect(page.getByRole('dialog', { name: 'Choose cherry' }).getByRole('button', { name: /Muddled/ })).toContainText(
    'Not in My Bar',
  )
})

test('a missing garnish is not marked, and with Can make off nothing is', async ({ page }) => {
  await seedMyBar(page, ['jigger'], ['limes', 'cherry-syrup', 'simple-syrup', 'soda-water', 'ice'])
  await page.goto('/')
  await canMake(page).click()
  await page.getByRole('link', { name: /Cherry Limeade/ }).click()
  await page.getByRole('button', { name: /^Garnish:/ }).click()
  await expect(page.getByRole('dialog', { name: 'Choose garnish' })).not.toContainText('Not in My Bar')

  await page.goto('/')
  await canMake(page).click()
  await page.goto('/drinks/cherry-limeade')
  await page.getByRole('button', { name: /^Sweetener:/ }).click()
  await expect(page.getByRole('dialog', { name: 'Choose sweetener' })).not.toContainText('Not in My Bar')
})

// A Sunday Limeade: a Cherry Limeade with soda water, plus this ingredient.
async function copyWithIngredient(page: Page, name: string, countsAs?: string) {
  await page.goto('/drinks/cherry-limeade/fizz=soda-water')
  await page.getByRole('button', { name: 'Make a copy' }).click()
  await page.getByRole('link', { name: 'Edit this drink' }).click()
  await page.getByLabel('Name', { exact: true }).fill('Sunday Limeade')
  await page.getByRole('button', { name: 'Add an ingredient' }).first().click()
  await page.getByLabel('Amount of ingredient 3', { exact: true }).fill('1')
  await page.getByLabel('Unit of ingredient 3', { exact: true }).selectOption('count')
  await page.getByLabel('Ingredient 3', { exact: true }).fill(name)
  if (countsAs) await page.getByLabel('Counts as, ingredient 3').selectOption({ label: countsAs })
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('heading', { name: 'Sunday Limeade' })).toBeVisible()
}

const limeadeBar = ['limes', 'cherry-syrup', 'simple-syrup', 'soda-water', 'ice']

test('the editor suggests Lemons for a charred lemon wheel, and ticking Lemons makes the Drink', async ({ page }) => {
  await seedMyBar(page, ['jigger'], limeadeBar)
  await page.goto('/drinks/cherry-limeade/fizz=soda-water')
  await page.getByRole('button', { name: 'Make a copy' }).click()
  await page.getByRole('link', { name: 'Edit this drink' }).click()
  await page.getByRole('button', { name: 'Add an ingredient' }).first().click()
  await page.getByLabel('Ingredient 3', { exact: true }).fill('charred lemon wheel')
  await expect(page.getByLabel('Counts as, ingredient 3')).toContainText('Lemons (suggested)')
  await page.getByLabel('Ingredient 3', { exact: true }).fill('yuzu juice')
  await expect(page.getByLabel('Counts as, ingredient 3')).toContainText('Its own item (suggested)')
  await page.getByLabel('Name', { exact: true }).fill('Sunday Limeade')
  await page.getByLabel('Amount of ingredient 3', { exact: true }).fill('1')
  await page.getByLabel('Ingredient 3', { exact: true }).fill('charred lemon wheel')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('heading', { name: 'Sunday Limeade' })).toBeVisible()

  await page.goto('/my-bar')
  await expect(page.getByRole('region', { name: 'From your drinks' })).toHaveCount(0)
  await page.goto('/')
  await canMake(page).click()
  await expect(page.getByRole('link', { name: /Sunday Limeade/ })).toHaveCount(0)

  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: 'My Bar' }).click()
  await page.getByRole('button', { name: 'Lemons' }).click()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('link', { name: /Sunday Limeade/ })).toBeVisible()
})

test('yuzu juice is its own item, under From your drinks', async ({ page }) => {
  await seedMyBar(page, ['jigger'], limeadeBar)
  await copyWithIngredient(page, 'yuzu juice')
  await page.goto('/my-bar')
  await expect(page.getByRole('region', { name: 'From your drinks' }).getByRole('button', { name: 'Yuzu juice' })).toBeVisible()
})

test('always on hand never blocks a Drink, and the choice is kept when it opens again', async ({ page }) => {
  await seedMyBar(page, ['jigger'], limeadeBar)
  await copyWithIngredient(page, 'yuzu juice', 'Always on hand')

  await page.goto('/')
  await canMake(page).click()
  await page.getByRole('link', { name: /Sunday Limeade/ }).click()
  await page.getByRole('link', { name: 'Edit this drink' }).click()
  await expect(page.getByLabel('Counts as, ingredient 3').locator('option:checked')).toHaveText('Always on hand')
})

test('a Custom Drink with no choice opens and saves without one', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade/fizz=soda-water')
  await page.getByRole('button', { name: 'Make a copy' }).click()
  await page.getByRole('link', { name: 'Edit this drink' }).click()
  await expect(page.getByLabel('Counts as, ingredient 1').locator('option:checked')).toContainText('(suggested)')
  await page.getByLabel('Name', { exact: true }).fill('Sunday Limeade')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('heading', { name: 'Sunday Limeade' })).toBeVisible()

  const saved = await page.evaluate<string>(`new Promise((resolve) => {
    const open = indexedDB.open('fizzwick')
    open.onsuccess = () => {
      const all = open.result.transaction('drinks').objectStore('drinks').getAll()
      all.onsuccess = () => resolve(JSON.stringify(all.result))
    }
  })`)
  expect(saved).toContain('Sunday Limeade')
  expect(saved).not.toContain('countsAs')
})

test('the choice survives a backup and restore', async ({ page, browser }) => {
  await copyWithIngredient(page, 'yuzu juice', 'Always on hand')
  await page.goto('/settings')
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download a backup' }).click()
  const backup = await (await downloading).path()

  const phoneContext = await browser.newContext()
  const phone = await phoneContext.newPage()
  await phone.goto('/settings')
  await phone.getByLabel('Restore from backup', { exact: true }).setInputFiles(backup)
  await phone.getByRole('dialog', { name: 'Restore this backup?' }).getByRole('button', { name: 'Restore' }).click()
  await expect(phone.getByRole('status')).toHaveText('Added 1 Drink.')

  await phone.goto('/')
  await phone.getByRole('link', { name: /Sunday Limeade/ }).click()
  await phone.getByRole('link', { name: 'Edit this drink' }).click()
  await expect(phone.getByLabel('Counts as, ingredient 3').locator('option:checked')).toHaveText('Always on hand')
  await phoneContext.close()
})

test('ticks change the count, last after a reload, and start empty', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: 'My Bar' }).click()
  await expect(page.getByRole('heading', { name: 'My Bar', level: 1 })).toBeVisible()
  await expect(page.getByText('You can make 0 drinks')).toBeVisible()
  await expect(page.getByRole('button', { pressed: true })).toHaveCount(0)

  await tickCherryLimeade(page)
  const count = page.getByText(/You can make [1-9]\d* drinks?/)
  await expect(count).toBeVisible()
  const made = await count.textContent()

  await page.reload()
  await expect(page.getByText(made!)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Limes' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Jigger' })).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Limes' }).click()
  await expect(page.getByRole('button', { name: 'Limes' })).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByText(made!)).toHaveCount(0)
})

test('lists tools first, with no stand-ins, garnish-only items or water', async ({ page }) => {
  await page.goto('/my-bar')
  await expect(page.getByRole('region').first()).toHaveAccessibleName('Tools')
  await expect(page.getByRole('region', { name: 'Tools' }).getByRole('button')).toHaveText([
    'Jigger',
    'Shaker',
    'Fine strainer',
    'Muddler',
    'Blender',
  ])
  for (const name of ['Pickles', 'Rosemary', 'Cold water', 'Just-boiled water', 'Lemon wheel']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0)
  }
  await expect(page.getByRole('button', { name: 'Ice', exact: true })).toHaveCount(1)
})

test('search narrows the tools and ingredients together', async ({ page }) => {
  await page.goto('/my-bar')
  const search = page.getByRole('searchbox', { name: 'Search My Bar' })

  await search.fill('strain')
  await expect(page.getByRole('button', { name: 'Fine strainer' })).toBeVisible()
  await expect(page.getByRole('region')).toHaveCount(1)

  await search.fill('lemon peel')
  await expect(page.getByRole('button', { name: 'Lemons' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Tools' })).toHaveCount(0)

  await search.fill('durian')
  await expect(page.getByText('Nothing in My Bar matches "durian".')).toBeVisible()
})

test('a Custom Drink ingredient the list does not know shows until the Drink is deleted', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade/fizz=soda-water')
  await page.getByRole('button', { name: 'Make a copy' }).click()
  await expect(page.getByRole('heading', { name: 'Cherry Limeade · soda water' })).toBeVisible()
  const drinkUrl = page.url()
  await page.getByRole('link', { name: 'Edit this drink' }).click()
  await page.getByRole('button', { name: 'Add an ingredient' }).first().click()
  await page.getByLabel('Amount of ingredient 3', { exact: true }).fill('2')
  await page.getByLabel('Unit of ingredient 3', { exact: true }).selectOption('dash')
  await page.getByLabel('Ingredient 3', { exact: true }).fill('Smoked Bark')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Smoked Bark', { exact: false })).toBeVisible()

  await page.goto('/my-bar')
  await tickCherryLimeade(page)
  const count = page.getByText(/You can make \d+ drinks?/)
  const before = Number((await count.textContent())!.match(/\d+/)![0])

  const yours = page.getByRole('region', { name: 'From your drinks' })
  await yours.getByRole('button', { name: 'Smoked bark' }).click()
  await expect(page.getByText(`You can make ${before + 1} drinks`)).toBeVisible()

  await page.goto(drinkUrl)
  await page.getByRole('button', { name: 'Delete this drink' }).click()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: /Cherry Limeade · soda water/ })).toHaveCount(0)

  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('link', { name: 'My Bar' }).click()
  await expect(page.getByRole('button', { name: 'Limes' })).toBeVisible()
  await expect(yours).toHaveCount(0)
})
