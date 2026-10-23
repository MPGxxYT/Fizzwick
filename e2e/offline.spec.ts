import { expect, test } from '@playwright/test'

test('after one visit, a Riff link opens offline', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Fizzwick' })).toBeVisible()
  // Wait until the service worker has cached everything and controls the page.
  await page.evaluate('navigator.serviceWorker.ready')
  await expect.poll(() => page.evaluate<boolean>('!!navigator.serviceWorker.controller')).toBe(true)

  await context.setOffline(true)
  await page.goto('/drinks/cherry-limeade/fizz=soda-water')
  await expect(page.getByRole('heading', { name: 'Cherry Limeade' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Fizz: soda water/ })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Ingredients' })).toContainText('soda water')
})

test('the app can be installed', async ({ page, request }) => {
  await page.goto('/')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  const manifest = await (await request.get(href!)).json()
  expect(manifest).toMatchObject({ name: 'Fizzwick', start_url: '/', display: 'standalone' })
  for (const icon of manifest.icons as { src: string }[]) {
    expect((await request.get(icon.src)).ok()).toBe(true)
  }
  const worker = await request.get('/sw.js')
  expect(await worker.text()).toContain('/index.html')
})
