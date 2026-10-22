import { expect, test } from '@playwright/test'

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
  await page.getByRole('searchbox', { name: 'Search drinks or ingredients' }).fill('agave')
  await expect(page.getByRole('link', { name: /Cherry Limeade/ })).toBeVisible()
  await expect(page.getByText('1 drink', { exact: true })).toBeVisible()
})

test('a search with no matches says so and can be cleared', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('searchbox', { name: 'Search drinks or ingredients' }).fill('mango')
  await expect(page.getByText('No drinks match "mango"')).toBeVisible()
  await expect(page.getByRole('link', { name: /Cherry Limeade/ })).toHaveCount(0)

  await page.getByRole('button', { name: 'Clear search and filters' }).click()
  await expect(page.getByRole('link', { name: /Cherry Limeade/ })).toBeVisible()
  await expect(page.getByRole('searchbox', { name: 'Search drinks or ingredients' })).toHaveValue('')
})

test('filters toggle on and off, and the list keeps them after visiting a Drink', async ({ page }) => {
  await page.goto('/')
  const build = page.getByRole('group', { name: 'Method' }).getByRole('button', { name: 'Build' })
  await build.click()
  await expect(build).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/method=build/)

  await page.getByRole('link', { name: /Cherry Limeade/ }).click()
  await page.getByRole('link', { name: 'All drinks' }).click()
  await expect(page.getByRole('group', { name: 'Method' }).getByRole('button', { name: 'Build' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.getByRole('group', { name: 'Method' }).getByRole('button', { name: 'Build' }).click()
  await expect(page).not.toHaveURL(/method=/)
})
