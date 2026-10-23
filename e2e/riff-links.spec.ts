import { expect, test } from '@playwright/test'

interface Shared {
  title: string
  text: string
  url: string
}

test('swapping an Option updates the Riff link, and the link opens that Riff', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade')
  await page.getByRole('button', { name: /^Fizz: lemon-lime soda/ }).click()
  await page.getByRole('dialog', { name: 'Choose fizz' }).getByRole('button', { name: 'Soda water' }).click()
  await expect(page).toHaveURL(/\/drinks\/cherry-limeade\/fizz=soda-water$/)

  await page.reload()
  await expect(page.getByRole('button', { name: /^Fizz: soda water/ })).toBeVisible()

  await page.getByRole('button', { name: 'Reset to House Spec' }).click()
  await expect(page).toHaveURL(/\/drinks\/cherry-limeade$/)
})

test('a link with an Option this version lacks opens the House Spec for that Slot, with a notice', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade/cherry=muddled-cherries,fizz=dragonfruit-soda')
  await expect(page.getByRole('button', { name: /^Cherry: muddled fresh cherries/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Fizz: lemon-lime soda/ })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: "asks for a fizz this version of Fizzwick doesn't have" })).toBeVisible()
})

test('a link to an unknown Drink shows the not-found page, which links home', async ({ page }) => {
  await page.goto('/drinks/no-such-drink/fizz=soda-water')
  await expect(page.getByRole('heading', { name: 'No drink here' })).toBeVisible()
  await page.getByRole('link', { name: 'See all drinks' }).click()
  await expect(page.getByRole('heading', { name: 'Fizzwick' })).toBeVisible()
})

test('Share uses the share sheet when there is one', async ({ page }) => {
  // A share sheet that just records what it was given.
  await page.addInitScript('window.shared = []; navigator.share = async (data) => { window.shared.push(data) }')
  await page.goto('/drinks/cherry-limeade/fizz=soda-water')
  await page.getByRole('button', { name: 'Share this Riff' }).click()
  const shared = await page.evaluate<Shared[]>('window.shared')
  expect(shared).toEqual([
    {
      title: 'Cherry Limeade',
      text: 'Cherry Limeade · cherry syrup, soda water, lime wheel and cherry',
      url: 'http://localhost:4173/drinks/cherry-limeade/fizz=soda-water',
    },
  ])
})

test('Share copies the link where there is no share sheet', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.addInitScript('delete Navigator.prototype.share')
  await page.goto('/drinks/cherry-limeade/sweetener=agave')
  await page.getByRole('button', { name: 'Share this Riff' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Link copied' })).toBeVisible()
  expect(await page.evaluate<string>('navigator.clipboard.readText()')).toBe(
    'http://localhost:4173/drinks/cherry-limeade/sweetener=agave',
  )
})
