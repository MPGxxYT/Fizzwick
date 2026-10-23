import { expect, test } from '@playwright/test'

test('tapping a Bar Term on the Drink page explains it and leads to the Bar Terms page', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade')
  const card = page.getByRole('region', { name: "You'll need" })
  // Top is underlined as a measure, and only that first time.
  await expect(card.getByRole('button', { name: 'Top', exact: true })).toHaveCount(1)
  await expect(page.getByRole('list', { name: 'How to make it' })).toContainText('Top with lemon-lime soda.')

  await card.getByRole('button', { name: 'barspoon' }).click()
  const sheet = page.getByRole('dialog', { name: 'Barspoon' })
  await expect(sheet).toContainText('A long, thin spoon for stirring drinks.')
  await sheet.getByRole('link', { name: 'All Bar Terms' }).click()

  await expect(page).toHaveURL(/\/bar-terms#barspoon$/)
  await expect(page.getByRole('heading', { name: 'Bar Terms' })).toBeVisible()
  // The term you came from opens straight away.
  const again = page.getByRole('dialog', { name: 'Barspoon' })
  await expect(again).toContainText('A long, thin spoon for stirring drinks.')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('heading', { name: 'Cherry Limeade' })).toBeVisible()
})

test('tapping a Bar Term in step mode explains it without turning the step', async ({ page }) => {
  await page.goto('/drinks/tea-sour')
  await page.getByRole('button', { name: 'Make it' }).click()
  const making = page.getByRole('dialog', { name: 'Making Tea Sour' })
  await making.getByRole('button', { name: 'Start' }).click()
  for (let step = 2; step <= 4; step++) await making.getByRole('button', { name: 'Next step' }).click()
  await expect(making).toContainText('Step 4 of')

  await making.getByRole('button', { name: 'Dry shake' }).click()
  const sheet = page.getByRole('dialog', { name: 'Dry shake' })
  await expect(sheet).toContainText('Shaking without ice first')
  await expect(sheet.getByRole('link')).toHaveCount(0)
  await sheet.getByText('Shaking without ice first').click()
  await page.keyboard.press('Escape')

  await expect(sheet).toHaveCount(0)
  await expect(making).toContainText('Step 4 of')
})

test('the home page links to the Bar Terms, which open on tap', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Bar Terms explained' }).click()
  await expect(page.getByRole('heading', { name: 'Glasses' })).toBeVisible()
  await page.getByRole('button', { name: 'Coupe' }).click()
  await expect(page.getByRole('dialog', { name: 'Coupe' })).toContainText('A shallow, wide bowl on a stem')
})

test('searching Bar Terms finds words in definitions and verb forms', async ({ page }) => {
  await page.goto('/bar-terms')
  const search = page.getByRole('searchbox', { name: 'Search Bar Terms' })
  const chips = page.getByRole('main').getByRole('listitem')

  await search.fill('foam')
  await expect(chips).toHaveText(['Dry shake', 'Aquafaba'])
  await search.fill('muddled')
  await expect(chips).toHaveText(['Muddle'])
  await search.fill('pineapple')
  await expect(page.getByText('No Bar Terms match "pineapple".')).toBeVisible()
  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(chips).toHaveCount(36)
})
