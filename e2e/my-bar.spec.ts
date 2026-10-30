import { expect, test, type Page } from '@playwright/test'

// Enough for a Cherry Limeade with soda water.
async function tickCherryLimeade(page: Page) {
  for (const name of ['Jigger', 'Limes', 'Cherry syrup', 'Simple syrup', 'Soda water', 'Ice']) {
    await page.getByRole('button', { name, exact: true }).click()
  }
}

test('ticks change the count, last after a reload, and start empty', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('link', { name: 'My Bar' }).click()
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
