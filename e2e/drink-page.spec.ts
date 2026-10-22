import { expect, test } from '@playwright/test'

test('swapping cherry syrup for muddled cherries adds the muddle step', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade')
  await expect(page.getByRole('heading', { name: 'Cherry Limeade' })).toBeVisible()

  const steps = page.getByRole('list', { name: 'How to make it' })
  await expect(steps).toContainText('Pour the lime juice and cherry syrup over the ice.')
  await expect(steps).not.toContainText('Muddle')
  await expect(page.getByRole('button', { name: 'Reset to House Spec' })).toHaveCount(0)

  await page.getByRole('button', { name: /^Cherry: cherry syrup/ }).click()
  const sheet = page.getByRole('dialog', { name: 'Choose cherry' })
  await sheet.getByRole('button', { name: 'Muddled fresh cherries' }).click()
  await expect(sheet).toHaveCount(0)

  await expect(steps).toContainText('Muddle the cherries with the lime juice in a shaker tin.')
  await expect(steps).not.toContainText('Pour the lime juice')

  await page.getByRole('button', { name: 'Reset to House Spec' }).click()
  await expect(steps).toContainText('Pour the lime juice and cherry syrup over the ice.')
})

test('Escape closes a choice sheet without changing anything', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade')
  await page.getByRole('button', { name: /^Fizz: lemon-lime soda/ }).click()
  await expect(page.getByRole('dialog', { name: 'Choose fizz' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Choose fizz' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Fizz: lemon-lime soda/ })).toBeVisible()
})

test('scaling to three drinks triples the amounts', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade')
  const more = page.getByRole('button', { name: 'More servings' })
  await more.click()
  await more.click()
  await expect(page.getByRole('group', { name: 'Servings' })).toContainText('3 drinks')
  const ingredients = page.getByRole('list', { name: 'Ingredients' })
  await expect(ingredients.getByRole('listitem').filter({ hasText: 'fresh lime juice' })).toContainText('2¼ oz')
})

test('a bigger glass scales the pours to fit', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade')
  await page.getByRole('button', { name: 'Collins glass' }).click()
  const sheet = page.getByRole('dialog', { name: 'Collins glass' })
  await expect(sheet).toContainText('12 oz')
  await sheet.getByLabel(/Using a different glass/).fill('16')
  await sheet.getByRole('button', { name: 'Use this size' }).click()

  await expect(page.getByText('Build, in a 16 oz')).toBeVisible()
  const ingredients = page.getByRole('list', { name: 'Ingredients' })
  await expect(ingredients.getByRole('listitem').filter({ hasText: 'fresh lime juice' })).toContainText('1 oz')
})

test('an unknown Drink shows a not-found page', async ({ page }) => {
  await page.goto('/drinks/no-such-drink')
  await expect(page.getByRole('heading', { name: 'No drink here' })).toBeVisible()
})

test('bubbles rise only behind fizzy drinks', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade')
  await expect(page.locator('.dp-bubbles')).toHaveCount(1)
  await page.goto('/drinks/tea-sour')
  await expect(page.getByRole('heading', { name: 'Tea Sour' })).toBeVisible()
  await expect(page.locator('.dp-bubbles')).toHaveCount(0)
})

test('ice cubes sit at the bottom of rocks drinks served on ice', async ({ page }) => {
  await page.goto('/drinks/garden-smash')
  await expect(page.locator('.dp-ice')).toHaveCount(1)
  await page.goto('/drinks/spiced-pear')
  await expect(page.getByRole('heading', { name: 'Spiced Pear' })).toBeVisible()
  await expect(page.locator('.dp-ice')).toHaveCount(0)
})
