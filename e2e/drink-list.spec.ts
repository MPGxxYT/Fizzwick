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
  await page.getByRole('searchbox', { name: 'Search drinks or ingredients' }).fill('sparkling limeade')
  await expect(page.getByRole('link', { name: /Cherry Limeade/ })).toBeVisible()
  await expect(page.getByText('1 drink', { exact: true })).toBeVisible()
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
