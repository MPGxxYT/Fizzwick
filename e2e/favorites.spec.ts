import { expect, test } from '@playwright/test'

test('a saved Favorite survives a reload and opens its exact Riff', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade')
  await page.getByRole('button', { name: /^Fizz: lemon-lime soda/ }).click()
  await page.getByRole('dialog', { name: 'Choose fizz' }).getByRole('button', { name: 'Soda water' }).click()
  await page.getByRole('button', { name: 'Save to Favorites' }).click()
  await expect(page.getByRole('button', { name: 'Remove from Favorites' })).toHaveAttribute('aria-pressed', 'true')

  await page.reload()
  await page.goto('/')
  await page.getByRole('link', { name: 'Favorites', exact: true }).click()
  const favorites = page.getByRole('list', { name: 'Favorites' })
  await expect(favorites.getByRole('listitem')).toHaveCount(1)
  await favorites.getByRole('link', { name: /Cherry Limeade · cherry syrup, soda water/ }).click()

  await expect(page.getByRole('button', { name: /^Fizz: soda water/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Remove from Favorites' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Favorites', exact: true })).toBeVisible() // the way back
})

test('tapping a filled heart removes the Favorite', async ({ page }) => {
  await page.goto('/drinks/nojito')
  await page.getByRole('button', { name: 'Save to Favorites' }).click()
  await page.getByRole('button', { name: 'Remove from Favorites' }).click()
  await expect(page.getByRole('button', { name: 'Save to Favorites' })).toHaveAttribute('aria-pressed', 'false')

  await page.goto('/favorites')
  await expect(page.getByText('No Favorites yet.')).toBeVisible()
})

test('a Favorite can be renamed, given a note, and deleted', async ({ page }) => {
  await page.goto('/drinks/tea-sour')
  await page.getByRole('button', { name: 'Save to Favorites' }).click()
  await expect(page.getByRole('button', { name: 'Remove from Favorites' })).toBeVisible()
  await page.goto('/favorites')

  await page.getByRole('button', { name: /^Edit Tea Sour/ }).click()
  const sheet = page.getByRole('dialog', { name: 'Edit Favorite' })
  await sheet.getByLabel('Name').fill('Sour for Sam')
  await sheet.getByLabel('Note').fill('Half the syrup')
  await sheet.getByRole('button', { name: 'Save' }).click()

  const favorites = page.getByRole('list', { name: 'Favorites' })
  await expect(favorites).toContainText('Sour for Sam')
  await expect(favorites).toContainText('Half the syrup')

  await page.getByRole('button', { name: 'Edit Sour for Sam' }).click()
  await sheet.getByRole('button', { name: 'Delete' }).click()
  await sheet.getByRole('button', { name: 'Tap again to delete' }).click()
  await expect(page.getByText('No Favorites yet.')).toBeVisible()
})
