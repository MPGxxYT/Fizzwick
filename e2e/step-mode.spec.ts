import { expect, test } from '@playwright/test'

test('making a Riff goes from the Mise en Place through every step and back', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade')
  await page.getByRole('button', { name: /^Cherry: cherry syrup/ }).click()
  await page.getByRole('dialog', { name: 'Choose cherry' }).getByRole('button', { name: 'Muddled fresh cherries' }).click()
  await page.getByRole('button', { name: 'More servings' }).click()
  await page.getByRole('button', { name: 'Make it' }).click()

  const making = page.getByRole('dialog', { name: 'Making Cherry Limeade' })
  await expect(making.getByRole('heading', { name: 'Mise en Place' })).toBeVisible()
  await expect(making).toContainText('2 Collins glasses')
  await expect(making.getByRole('list', { name: 'Tools' })).toContainText('Muddler')
  await expect(making.getByRole('list', { name: 'Ingredients' })).toContainText('1½ oz')

  await making.getByRole('button', { name: 'Start' }).click()
  await expect(making).toContainText(/Step 1 of \d+/)
  await expect(making).toContainText('Muddle the cherries')

  const total = Number((await making.getByText(/Step 1 of \d+/).textContent())?.match(/of (\d+)/)?.[1])
  for (let step = 2; step <= total; step++) {
    await making.getByRole('button', { name: 'Next step' }).click()
    await expect(making).toContainText(`Step ${step} of ${total}`)
  }
  await expect(making.getByRole('button', { name: 'Next step' })).toHaveCount(0)

  await making.getByRole('button', { name: 'Done' }).click()
  await expect(making).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Cherry Limeade' })).toBeVisible()
  // The Riff is as it was.
  await expect(page.getByRole('group', { name: 'Servings' })).toContainText('2 drinks')
})

test('taps, swipes and going back move through step mode', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade')
  await page.getByRole('button', { name: 'Make it' }).click()
  const making = page.getByRole('dialog', { name: 'Making Cherry Limeade' })
  const box = (await page.viewportSize())!
  await expect(making.getByRole('heading', { name: 'Mise en Place' })).toBeVisible()

  await page.touchscreen.tap(box.width * 0.8, box.height * 0.5)
  await expect(making).toContainText('Step 1 of')
  await page.touchscreen.tap(box.width * 0.8, box.height * 0.5)
  await expect(making).toContainText('Step 2 of')
  // Above the current step is the one before it.
  await page.touchscreen.tap(box.width * 0.5, box.height * 0.14)
  await expect(making).toContainText('Step 1 of')
  // The steps don't scroll, so an upward swipe brings the next one up.
  await making.locator('.sm-stage').dispatchEvent('pointerdown', { clientX: 200, clientY: 600 })
  await making.locator('.sm-stage').dispatchEvent('pointerup', { clientX: 200, clientY: 400 })
  await expect(making).toContainText('Step 2 of')

  await page.goBack()
  await expect(making).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Make it' })).toBeVisible()
})

test('a timed step counts down and says when time is up', async ({ page }) => {
  await page.clock.install()
  await page.goto('/drinks/tea-sour')
  await page.getByRole('button', { name: 'Make it' }).click()
  const making = page.getByRole('dialog', { name: 'Making Tea Sour' })
  await making.getByRole('button', { name: 'Start' }).click()
  for (let step = 2; step <= 4; step++) await making.getByRole('button', { name: 'Next step' }).click()
  await expect(making.getByRole('heading', { name: /seal the tin and shake hard/ })).toBeVisible()

  await making.getByRole('button', { name: 'Start 0:15 timer' }).click()
  const clock = making.getByRole('timer')
  await page.clock.runFor(5_000)
  await expect(clock).toHaveText('0:10')
  await page.clock.runFor(10_500)
  await expect(clock).toHaveText("Time's up")
})
