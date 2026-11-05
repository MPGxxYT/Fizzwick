import { expect, test } from '@playwright/test'

test('Experimental changes switches House Drink amounts and step mode, and survives a reload', async ({ page }) => {
  const lemon = page.getByRole('list', { name: 'Ingredients' }).getByRole('listitem').filter({ hasText: 'fresh lemon juice' })
  await page.goto('/drinks/lavender-lemon-fizz')
  await expect(lemon).toContainText('¾ oz')

  await page.goto('/settings')
  const experimental = page.getByRole('switch', { name: 'Experimental changes' })
  await expect(experimental).toHaveAttribute('aria-checked', 'false')
  await experimental.click()
  await page.reload()
  await expect(experimental).toHaveAttribute('aria-checked', 'true')

  await page.goto('/drinks/lavender-lemon-fizz')
  await expect(lemon).toContainText('½ oz')

  // Garden Smash gains soda water, with a step that shows its amount.
  await page.goto('/drinks/garden-smash')
  await expect(page.getByRole('list', { name: 'Ingredients' }).getByRole('listitem').filter({ hasText: 'soda water' })).toContainText('2 oz')
  await page.getByRole('button', { name: 'Make it' }).click()
  await expect(page.getByRole('dialog', { name: 'Making Garden Smash' })).toBeVisible()

  await page.goto('/settings')
  await experimental.click()
  await page.goto('/drinks/lavender-lemon-fizz')
  await expect(lemon).toContainText('¾ oz')
})

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
