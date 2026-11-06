import type { Page } from '@playwright/test'

// The Drink list's Filters sheet, opened if it isn't already.
export async function openFilters(page: Page) {
  const sheet = page.getByRole('dialog', { name: 'Filters' })
  if (!(await sheet.isVisible())) await page.getByRole('button', { name: /^Filters/ }).click()
  return sheet
}

export async function closeFilters(page: Page) {
  await page.getByRole('dialog', { name: 'Filters' }).getByRole('button', { name: 'Close' }).click()
}
