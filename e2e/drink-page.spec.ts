import { expect, test } from '@playwright/test'

test('swapping cherry syrup for muddled cherries adds the muddle step', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade')
  await expect(page.getByRole('heading', { name: 'Cherry Limeade' })).toBeVisible()

  const steps = page.getByRole('list', { name: 'Steps' })
  await expect(steps).toContainText('Pour the lime juice and cherry syrup over the ice.')
  await expect(steps).not.toContainText('Muddle')
  await expect(page.getByRole('button', { name: 'Back to House Spec' })).toBeDisabled()

  await page.getByText('Muddled fresh cherries').click()

  await expect(steps).toContainText('Muddle the cherries with the lime juice in a shaker tin.')
  await expect(steps).not.toContainText('Pour the lime juice')
  await expect(page.getByRole('img', { name: /in your Riff's colors/ })).toBeVisible()

  await page.getByRole('button', { name: 'Back to House Spec' }).click()
  await expect(steps).toContainText('Pour the lime juice and cherry syrup over the ice.')
})

test('scaling to three servings triples the amounts', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade')
  const more = page.getByRole('button', { name: 'More servings' })
  await more.click()
  await more.click()
  await expect(page.getByRole('group', { name: 'Servings' })).toContainText('3 servings')
  await expect(page.getByRole('listitem').filter({ hasText: 'fresh lime juice' })).toContainText('2¼ oz')
})

test('an unknown Drink shows a not-found page', async ({ page }) => {
  await page.goto('/drinks/no-such-drink')
  await expect(page.getByRole('heading', { name: 'No drink here' })).toBeVisible()
})
