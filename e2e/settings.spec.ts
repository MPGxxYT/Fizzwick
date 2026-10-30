import { expect, test } from '@playwright/test'

test('units and underlines change the Drink page and step mode, and survive a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('link', { name: 'Settings' }).click()
  // The test browser is en-US, so ounces to start with.
  await expect(page.getByRole('radio', { name: 'Ounces (oz)' })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('radio', { name: 'Millilitres (ml)' }).click()
  const underlines = page.getByRole('switch', { name: 'Bar Term underlines' })
  await underlines.click()
  await expect(underlines).toHaveAttribute('aria-checked', 'false')

  await page.reload()
  await expect(page.getByRole('radio', { name: 'Millilitres (ml)' })).toHaveAttribute('aria-checked', 'true')
  await expect(underlines).toHaveAttribute('aria-checked', 'false')

  await page.goto('/drinks/cherry-limeade')
  const ingredients = page.getByRole('list', { name: 'Ingredients' })
  await expect(ingredients.getByRole('listitem').filter({ hasText: 'fresh lime juice' })).toContainText('25 ml')

  // No underline, but a tap still explains the term.
  const barspoon = page.getByRole('region', { name: "You'll need" }).getByRole('button', { name: 'barspoon' })
  await expect(barspoon).toHaveCSS('text-decoration-line', 'none')
  await barspoon.click()
  await expect(page.getByRole('dialog', { name: 'Barspoon' })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Make it' }).click()
  const making = page.getByRole('dialog', { name: 'Making Cherry Limeade' })
  await expect(making.getByRole('list', { name: 'Ingredients' })).toContainText('25 ml')
})

test('settings fall back to the defaults when storage holds something else', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fizzwick.settings', '{not json'))
  await page.goto('/settings')
  await expect(page.getByRole('radio', { name: 'Ounces (oz)' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('switch', { name: 'Bar Term underlines' })).toHaveAttribute('aria-checked', 'true')
})
