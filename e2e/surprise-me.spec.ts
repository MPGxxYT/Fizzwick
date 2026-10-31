import { expect, test, type Page } from '@playwright/test'

const surpriseMe = (page: Page) => page.getByRole('button', { name: 'Surprise me' })
const tryAnother = (page: Page) => page.getByRole('button', { name: 'Try another' })
const drinkName = (page: Page) => page.getByRole('heading', { level: 1 }).textContent()

test('Surprise me picks from the list as filtered, and a Riff that fits', async ({ page }) => {
  await page.goto('/?method=blend')
  await surpriseMe(page).click()
  await expect(page).toHaveURL(/\/drinks\//)
  // Every Riff it can land on blends, whatever the Drink.
  await expect(page.getByText(/^Blend, in a/)).toBeVisible()
})

test('search counts too', async ({ page }) => {
  await page.goto('/?q=cherry+limeade')
  await surpriseMe(page).click()
  await expect(page).toHaveURL(/\/drinks\/cherry-limeade/)
  await expect(page.getByRole('heading', { name: 'Cherry Limeade' })).toBeVisible()
})

test('Can make counts too', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'fizzwick.my-bar',
      JSON.stringify({ tools: ['jigger'], items: ['limes', 'cherry-syrup', 'simple-syrup', 'soda-water', 'ice'] }),
    )
    localStorage.setItem('fizzwick.settings', JSON.stringify({ canMake: true }))
  })
  await page.goto('/')
  await expect(page.getByText('1 drink', { exact: true })).toBeVisible()
  await surpriseMe(page).click()
  await expect(page).toHaveURL(/\/drinks\/cherry-limeade/)
  await expect(page).toHaveURL(/fizz=soda-water/)
})

test('the button is off on an empty list', async ({ page }) => {
  await page.goto('/?q=durian')
  await expect(surpriseMe(page)).toBeDisabled()
})

test('Try another keeps the filters, never repeats a Drink, and Back goes to the list', async ({ page }) => {
  await page.goto('/?method=blend')
  await surpriseMe(page).click()
  await expect(tryAnother(page)).toBeVisible()

  let last = await drinkName(page)
  for (let turn = 0; turn < 6; turn++) {
    await tryAnother(page).click()
    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(last!)
    await expect(page.getByText(/^Blend, in a/)).toBeVisible()
    last = await drinkName(page)
  }

  await page.goBack()
  await expect(page).toHaveURL(/\/\?method=blend$/)
})

test('Try another shows only after Surprise me', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /Cherry Limeade/ }).click()
  await expect(page.getByRole('heading', { name: 'Cherry Limeade' })).toBeVisible()
  await expect(tryAnother(page)).toHaveCount(0)

  await page.goto('/drinks/cherry-limeade')
  await expect(tryAnother(page)).toHaveCount(0)
})

test('swapping an Option keeps Try another', async ({ page }) => {
  await page.goto('/?q=cherry+limeade')
  await surpriseMe(page).click()
  await page.getByRole('button', { name: /^Fizz:/ }).click()
  await page.getByRole('dialog', { name: 'Choose fizz' }).getByRole('button', { name: /Sparkling limeade/ }).click()
  await expect(page).toHaveURL(/fizz=sparkling-limeade/)
  await expect(tryAnother(page)).toBeVisible()
})
