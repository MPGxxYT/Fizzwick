import { expect, test } from '@playwright/test'

test('Make a copy saves the Riff as a Custom Drink that works like a House Drink', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade/fizz=soda-water')
  await page.getByRole('button', { name: 'Make a copy' }).click()

  await expect(page).toHaveURL(/\/drinks\/my-[a-z0-9]+$/)
  await expect(page.getByRole('heading', { name: 'Cherry Limeade · soda water' })).toBeVisible()
  await expect(page.getByText('Saved as a copy.')).toBeVisible()
  // The copied Riff is the copy's House Spec, so there's nothing to reset.
  await expect(page.getByRole('button', { name: /Reset to House Spec/ })).toHaveCount(0)

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Cherry Limeade · soda water' })).toBeVisible()

  await page.getByRole('link', { name: 'All drinks' }).click()
  await page.getByRole('group', { name: 'Show' }).getByRole('button', { name: 'Yours' }).click()
  await expect(page.getByText('1 drink', { exact: true })).toBeVisible()
  const card = page.getByRole('link', { name: /Cherry Limeade · soda water/ })
  await expect(card).toContainText('Yours')

  await card.click()
  await page.getByRole('button', { name: 'Make it' }).click()
  await expect(page.getByText('Mise en Place')).toBeVisible()
})

test('copying the House Spec twice names the copies apart', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade')
  await page.getByRole('button', { name: 'Make a copy' }).click()
  await expect(page.getByRole('heading', { name: 'Cherry Limeade (copy)' })).toBeVisible()

  await page.goto('/drinks/cherry-limeade')
  await page.getByRole('button', { name: 'Make a copy' }).click()
  await expect(page.getByRole('heading', { name: 'Cherry Limeade (copy 2)' })).toBeVisible()
})

test('a Favorite of a Custom Drink opens from Favorites', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade/fizz=soda-water')
  await page.getByRole('button', { name: 'Make a copy' }).click()
  await expect(page.getByRole('heading', { name: 'Cherry Limeade · soda water' })).toBeVisible()
  await page.getByRole('button', { name: 'Save to Favorites' }).click()
  await expect(page.getByRole('button', { name: 'Remove from Favorites' })).toBeVisible()

  await page.goto('/favorites')
  await page.getByRole('link', { name: /Cherry Limeade · soda water/ }).first().click()
  await expect(page.getByRole('heading', { name: 'Cherry Limeade · soda water' })).toBeVisible()
})
