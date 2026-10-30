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
