import { expect, test } from '@playwright/test'

test('Make a copy saves the Riff as a Custom Drink that works like a House Drink', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade/fizz=soda-water')
  await page.getByRole('button', { name: 'Make a copy' }).click()

  await expect(page).toHaveURL(/\/drinks\/my-[a-z0-9]+$/)
  await expect(page.getByRole('heading', { name: 'Cherry Limeade · soda water' })).toBeVisible()
  await expect(page.getByText('Saved as a copy.')).toBeVisible()
  // The copied Riff is the copy's House Spec, so there's nothing to reset.
  await expect(page.getByRole('button', { name: /Reset to House Spec/ })).toHaveCount(0)

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Cherry Limeade · soda water' })).toBeVisible()

  await page.getByRole('link', { name: 'All drinks' }).click()
  await page.getByRole('group', { name: 'Show' }).getByRole('button', { name: 'Yours' }).click()
  await expect(page.getByText('1 drink', { exact: true })).toBeVisible()
  const card = page.getByRole('link', { name: /Cherry Limeade · soda water/ })
  await expect(card).toContainText('Yours')

  await card.click()
  await page.getByRole('button', { name: 'Make it' }).click()
  await expect(page.getByText('Mise en Place')).toBeVisible()
})

test('copying the House Spec twice names the copies apart', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade')
  await page.getByRole('button', { name: 'Make a copy' }).click()
  await expect(page.getByRole('heading', { name: 'Cherry Limeade (copy)' })).toBeVisible()

  await page.goto('/drinks/cherry-limeade')
  await page.getByRole('button', { name: 'Make a copy' }).click()
  await expect(page.getByRole('heading', { name: 'Cherry Limeade (copy 2)' })).toBeVisible()
})

test('a Favorite of a Custom Drink opens from Favorites', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade/fizz=soda-water')
  await page.getByRole('button', { name: 'Make a copy' }).click()
  await expect(page.getByRole('heading', { name: 'Cherry Limeade · soda water' })).toBeVisible()
  await page.getByRole('button', { name: 'Save to Favorites' }).click()
  await expect(page.getByRole('button', { name: 'Remove from Favorites' })).toBeVisible()

  await page.goto('/favorites')
  await page.getByRole('link', { name: /Cherry Limeade · soda water/ }).first().click()
  await expect(page.getByRole('heading', { name: 'Cherry Limeade · soda water' })).toBeVisible()
})

test('deleting a Custom Drink asks first, then removes it and its Favorites', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade/fizz=soda-water')
  await page.getByRole('button', { name: 'Make a copy' }).click()
  await expect(page.getByRole('heading', { name: 'Cherry Limeade · soda water' })).toBeVisible()
  await page.getByRole('button', { name: 'Save to Favorites' }).click()
  await expect(page.getByRole('button', { name: 'Remove from Favorites' })).toBeVisible()

  await page.getByRole('button', { name: 'Delete this drink' }).click()
  const sheet = page.getByRole('dialog', { name: 'Delete Cherry Limeade · soda water?' })
  await expect(sheet).toContainText('This also removes your 1 Favorite of it.')
  await sheet.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('heading', { name: 'Cherry Limeade · soda water' })).toBeVisible()

  await page.getByRole('button', { name: 'Delete this drink' }).click()
  await sheet.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: /Cherry Limeade · soda water/ })).toHaveCount(0)
  await expect(page.getByRole('group', { name: 'Show' })).toHaveCount(0)

  await page.goto('/favorites')
  await expect(page.getByText('No Favorites yet.')).toBeVisible()
})

test('House Drinks have no Delete button', async ({ page }) => {
  await page.goto('/drinks/cherry-limeade')
  await expect(page.getByRole('heading', { name: 'Cherry Limeade' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Delete this drink' })).toHaveCount(0)
})

async function copyCherryLimeade(page: import('@playwright/test').Page) {
  await page.goto('/drinks/cherry-limeade/fizz=soda-water')
  await page.getByRole('button', { name: 'Make a copy' }).click()
  await expect(page.getByRole('heading', { name: 'Cherry Limeade · soda water' })).toBeVisible()
}

test('editing a Custom Drink changes its page and step mode', async ({ page }) => {
  await copyCherryLimeade(page)
  await page.getByRole('link', { name: 'Edit this drink' }).click()
  await expect(page.getByRole('heading', { name: 'Edit drink' })).toBeVisible()

  await page.getByLabel('Name', { exact: true }).fill('Sunday Limeade')
  await page.getByRole('group', { name: 'Glass' }).getByRole('button', { name: 'Highball glass' }).click()
  await page.getByRole('button', { name: 'Add an ingredient' }).first().click()
  await page.getByLabel('Amount of ingredient 3', { exact: true }).fill('2')
  await page.getByLabel('Unit of ingredient 3', { exact: true }).selectOption('dash')
  await page.getByLabel('Ingredient 3', { exact: true }).fill('orange bitters')
  await page.getByLabel('Step 4', { exact: true }).fill('Top with {fizz} and wait.')
  await page.getByLabel('Step 4', { exact: true }).locator('..').getByRole('checkbox').check()
  await page.getByLabel('Minutes for step 4', { exact: true }).fill('0')
  await page.getByLabel('Seconds for step 4', { exact: true }).fill('30')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByRole('heading', { name: 'Sunday Limeade' })).toBeVisible()
  await expect(page.getByText('in a highball glass', { exact: false })).toBeVisible()
  await expect(page.getByText('orange bitters')).toBeVisible()
  await expect(page.getByText('Top with soda water and wait.')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Sunday Limeade' })).toBeVisible()

  // The timer shows in step mode: Start opens step 1, and the Top step is third.
  await page.getByRole('button', { name: 'Make it' }).click()
  const making = page.getByRole('dialog', { name: 'Making Sunday Limeade' })
  await making.getByRole('button', { name: 'Start' }).click()
  for (let step = 2; step <= 3; step++) await making.getByRole('button', { name: 'Next step' }).click()
  await expect(making.getByRole('button', { name: 'Start 0:30 timer' })).toBeVisible()
})

test('Save stays off until the Drink is valid, with the reason beside the field', async ({ page }) => {
  await copyCherryLimeade(page)
  await page.getByRole('link', { name: 'Edit this drink' }).click()
  const save = page.getByRole('button', { name: 'Save' })
  await expect(save).toBeEnabled()

  await page.getByLabel('Name', { exact: true }).fill('Cherry Limeade')
  await expect(page.getByText('You already have a drink called that.')).toBeVisible()
  await expect(save).toBeDisabled()

  await page.getByLabel('Name', { exact: true }).fill('My Limeade')
  await page.getByLabel('Step 3', { exact: true }).fill('Add the {fruit}.')
  await expect(page.getByText('There is no Slot called {fruit}.', { exact: false })).toBeVisible()
  await expect(save).toBeDisabled()
  await page.getByLabel('Step 3', { exact: true }).fill('Top with {fizz}.')
  await expect(save).toBeEnabled()
})

test('Preview shows the unsaved Drink and comes back to the editor with the changes', async ({ page }) => {
  await copyCherryLimeade(page)
  await page.getByRole('link', { name: 'Edit this drink' }).click()
  await page.getByLabel('Name', { exact: true }).fill('Preview Limeade')
  await page.getByRole('link', { name: 'Preview' }).click()

  await expect(page.getByRole('heading', { name: 'Preview Limeade' })).toBeVisible()
  await expect(page.getByText('Preview. Nothing is saved until you tap Save.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Make a copy' })).toHaveCount(0)

  await page.getByRole('link', { name: 'Back to editing' }).click()
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Preview Limeade')
})

test('leaving the editor with changes asks first', async ({ page }) => {
  await copyCherryLimeade(page)
  await page.getByRole('link', { name: 'Edit this drink' }).click()
  await page.getByLabel('Name', { exact: true }).fill('Never Saved')
  await page.getByRole('button', { name: 'Cancel' }).click()
  await page.getByRole('dialog', { name: 'Leave without saving?' }).getByRole('button', { name: 'Leave' }).click()
  await expect(page.getByRole('heading', { name: 'Cherry Limeade · soda water' })).toBeVisible()
})

test('a new drink from blank says what it still needs', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'New drink' }).click()
  await expect(page.getByRole('heading', { name: 'New drink' })).toBeVisible()
  await expect(page.getByText('Give the drink a name.')).toBeVisible()
  await expect(page.getByText('Pick at least one Flavor Tag.')).toBeVisible()
  await expect(page.getByText('Add at least one Slot with an Option.')).toBeVisible()
  await expect(page.getByText('Add at least one step.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled()

  // Nothing changed yet, so Cancel leaves without asking.
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('heading', { name: 'Fizzwick' })).toBeVisible()
})

// Waits for the Drink page, so the save has finished before moving on.
async function save(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('link', { name: 'Edit this drink' })).toBeVisible()
}

async function editCopy(page: import('@playwright/test').Page) {
  await copyCherryLimeade(page)
  await page.getByRole('link', { name: 'Edit this drink' }).click()
  await expect(page.getByRole('heading', { name: 'Edit drink' })).toBeVisible()
}

async function saveAFavorite(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Save to Favorites' }).click()
  await expect(page.getByRole('button', { name: 'Remove from Favorites' })).toBeVisible()
}

async function pickFizz(page: import('@playwright/test').Page, from: RegExp, to: string) {
  await page.getByRole('button', { name: from }).click()
  await page.getByRole('dialog', { name: 'Choose fizz' }).getByRole('button', { name: to }).click()
}

async function openFirstFavorite(page: import('@playwright/test').Page) {
  await page.goto('/favorites')
  await page.getByRole('list', { name: 'Favorites' }).getByRole('link').first().click()
}

test('a new Slot with two Options can be swapped after saving', async ({ page }) => {
  await editCopy(page)
  await page.getByLabel('New Slot, such as Fizz', { exact: true }).fill('Herb')
  await page.getByRole('button', { name: 'Add a Slot' }).click()
  await page.getByLabel('Herb Option 1', { exact: true }).fill('Mint')
  const herb = page.getByRole('listitem').filter({ has: page.getByLabel('Herb Option 1', { exact: true }) }).last()
  await herb.getByRole('button', { name: 'Add an ingredient' }).click()
  await page.getByLabel('Amount of Herb Option 1 ingredient 1', { exact: true }).fill('6')
  await page.getByLabel('Unit of Herb Option 1 ingredient 1', { exact: true }).selectOption('count')
  await page.getByLabel('Herb Option 1 ingredient 1', { exact: true }).fill('mint leaves')
  await page.getByLabel('New Herb Option', { exact: true }).fill('Basil')
  await page.getByRole('button', { name: 'Add an Option' }).last().click()
  await page.getByRole('button', { name: 'Add a step' }).click()
  await page.getByLabel('Step 7', { exact: true }).fill('Slap the {herb} and drop it in.')
  await save(page)

  await expect(page.getByText('Slap the mint and drop it in.')).toBeVisible()
  await expect(page.getByText('mint leaves')).toBeVisible()
  await page.getByRole('button', { name: /^Herb: mint/ }).click()
  await page.getByRole('dialog', { name: 'Choose herb' }).getByRole('button', { name: 'Basil' }).click()
  await expect(page.getByText('Slap the basil and drop it in.')).toBeVisible()
})

test('renaming an Option keeps the Favorites that use it', async ({ page }) => {
  await copyCherryLimeade(page)
  await pickFizz(page, /^Fizz: soda water/, 'Sparkling limeade')
  await saveAFavorite(page)

  await page.getByRole('link', { name: 'Edit this drink' }).click()
  await page.getByLabel('Fizz Option 3', { exact: true }).fill('Limeade, sparkling')
  await save(page)

  await openFirstFavorite(page)
  await expect(page.getByRole('button', { name: /^Fizz: limeade, sparkling/ })).toBeVisible()
})

test('removing an Option a Favorite uses retires it, and the Favorite still opens', async ({ page }) => {
  await copyCherryLimeade(page)
  await pickFizz(page, /^Fizz: soda water/, 'Sparkling limeade')
  await saveAFavorite(page)

  await page.getByRole('link', { name: 'Edit this drink' }).click()
  await page.getByRole('button', { name: 'Remove Fizz Option 3', exact: true }).click()
  await expect(page.getByText('Retired, kept for Favorites: Sparkling limeade.')).toBeVisible()
  const houseSpec = page.getByRole('group', { name: 'House Spec for Fizz' })
  await expect(houseSpec.getByRole('button', { name: 'Sparkling limeade' })).toHaveCount(0)
  await save(page)

  await openFirstFavorite(page)
  await expect(page.getByRole('button', { name: /^Fizz: sparkling limeade, retired/ })).toBeVisible()
})

test('removing a Slot a Favorite picks from warns first, and the Favorite opens without it', async ({ page }) => {
  await copyCherryLimeade(page)
  await saveAFavorite(page)

  await page.getByRole('link', { name: 'Edit this drink' }).click()
  await page.getByRole('button', { name: 'Remove Garnish', exact: true }).click()
  const sheet = page.getByRole('dialog', { name: 'Remove Garnish?' })
  await expect(sheet).toContainText('1 Favorite picks from this Slot.')
  await expect(sheet).toContainText('open without it.')
  await sheet.getByRole('button', { name: 'Remove', exact: true }).click()
  // The garnish step still names {garnish}, so it has to go too.
  await expect(page.getByText('There is no Slot called {garnish}.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Remove step 6' }).click()
  await save(page)

  await openFirstFavorite(page)
  await expect(page.getByRole('heading', { name: 'Cherry Limeade · soda water' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Garnish:/ })).toHaveCount(0)
})

test('a drink from blank can be saved once it has a Slot and a step', async ({ page }) => {
  await page.goto('/new')
  await page.getByLabel('Name', { exact: true }).fill('Plain Fizz')
  await page.getByRole('group', { name: 'Flavor Tags' }).getByRole('button', { name: 'Citrus' }).click()
  await page.getByLabel('New Slot, such as Fizz', { exact: true }).fill('Fizz')
  await page.getByRole('button', { name: 'Add a Slot' }).click()
  await page.getByLabel('Fizz Option 1', { exact: true }).fill('Soda water')
  await page.getByRole('button', { name: 'Add a step' }).click()
  await page.getByLabel('Step 1', { exact: true }).fill('Top with {fizz}.')
  await save(page)

  await expect(page.getByRole('heading', { name: 'Plain Fizz' })).toBeVisible()
  await expect(page.getByText('Top with soda water.')).toBeVisible()
})

test('a copied Option that adds steps still works after an edit elsewhere', async ({ page }) => {
  await editCopy(page)
  await expect(page.getByText('This Option changes the steps or Method', { exact: false })).toBeVisible()
  await page.getByLabel('Name', { exact: true }).fill('Muddle Limeade')
  await save(page)

  await page.getByRole('button', { name: /^Cherry: cherry syrup/ }).click()
  await page.getByRole('dialog', { name: 'Choose cherry' }).getByRole('button', { name: 'Muddled fresh cherries' }).click()
  await expect(page.getByText('Muddle the cherries with the lime juice in a shaker tin.')).toBeVisible()
})

test('step words suggest a tool, and ticking it adds it to the Mise en Place', async ({ page }) => {
  await editCopy(page)
  await page.getByLabel('Step 5', { exact: true }).fill('Muddle gently, then stir.')
  const tools = page.getByRole('group', { name: 'Tools for step 5' })
  const muddler = tools.getByRole('button', { name: 'Muddler, suggested' })
  await expect(muddler).toHaveAttribute('aria-pressed', 'false')
  await muddler.click()
  await expect(tools.getByRole('button', { name: 'Muddler', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await save(page)

  await page.getByRole('button', { name: 'Make it' }).click()
  await expect(page.getByRole('dialog', { name: /^Making/ })).toContainText(/muddler/i)
})

test('ingredient words suggest a Dietary Tag, which shows only once ticked', async ({ page }) => {
  await editCopy(page)
  await page.getByLabel('New Fizz Option', { exact: true }).fill('Milk soda')
  await page.getByRole('button', { name: 'Add an Option' }).nth(2).click()
  const option = page.getByRole('listitem').filter({ has: page.getByLabel('Fizz Option 4', { exact: true }) }).last()
  await option.getByRole('button', { name: 'Add an ingredient' }).click()
  await page.getByLabel('Amount of Fizz Option 4 ingredient 1', { exact: true }).fill('2')
  await page.getByLabel('Fizz Option 4 ingredient 1', { exact: true }).fill('whole milk')
  await page.getByRole('group', { name: 'House Spec for Fizz' }).getByRole('button', { name: 'Milk soda' }).click()

  const dairy = page.getByLabel('Fizz Option 4 contains dairy, suggested', { exact: true })
  await expect(dairy).not.toBeChecked()
  await save(page)
  await expect(page.getByText('whole milk')).toBeVisible()
  await expect(page.getByText('Contains dairy')).toHaveCount(0)

  await page.getByRole('link', { name: 'Edit this drink' }).click()
  await page.getByLabel('Fizz Option 4 contains dairy, suggested', { exact: true }).check()
  await save(page)
  await expect(page.getByText('Contains dairy')).toBeVisible()
})

test("a new Option's color comes from its name and can be changed", async ({ page }) => {
  await editCopy(page)
  await page.getByLabel('New Cherry Option', { exact: true }).fill('Blueberry syrup')
  await page.getByRole('button', { name: 'Add an Option' }).first().click()
  const colors = page.getByRole('group', { name: 'Cherry Option 4 color' })
  await expect(colors.getByRole('button', { name: 'blueberry' })).toHaveAttribute('aria-pressed', 'true')

  await colors.getByRole('button', { name: 'lime' }).click()
  await expect(colors.getByRole('button', { name: 'lime' })).toHaveAttribute('aria-pressed', 'true')
  await expect(colors.getByRole('button', { name: 'blueberry' })).toHaveAttribute('aria-pressed', 'false')
})

// A big, busy photo, drawn in the page and handed back as PNG bytes.
async function bigPhoto(page: import('@playwright/test').Page) {
  // A string, since the e2e tests are type-checked without the browser's types.
  const base64 = await page.evaluate<string>(`(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 4000
    canvas.height = 3000
    const context = canvas.getContext('2d')
    const gradient = context.createLinearGradient(0, 0, 4000, 3000)
    gradient.addColorStop(0, '#b3123a')
    gradient.addColorStop(1, '#f5d94a')
    context.fillStyle = gradient
    context.fillRect(0, 0, 4000, 3000)
    for (let i = 0; i < 400; i++) {
      context.fillStyle = 'hsl(' + ((i * 37) % 360) + ' 70% 60%)'
      context.beginPath()
      context.arc((i * 523) % 4000, (i * 331) % 3000, 40 + (i % 90), 0, Math.PI * 2)
      context.fill()
    }
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    const bytes = new Uint8Array(await blob.arrayBuffer())
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return btoa(binary)
  })()`)
  return { name: 'drink.png', mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') }
}

test('a photo picked in the editor shows on the card, small enough, and can be removed', async ({ page }) => {
  await editCopy(page)
  const photo = await bigPhoto(page)
  expect(photo.buffer.length).toBeGreaterThan(100 * 1024)
  await page.getByLabel('Add a photo', { exact: true }).setInputFiles(photo)
  await expect(page.getByRole('img', { name: "The drink's photo" })).toBeVisible()
  await save(page)

  const stored = await page.evaluate<number>(`new Promise((resolve, reject) => {
    const request = indexedDB.open('fizzwick')
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const all = request.result.transaction('photos').objectStore('photos').getAll()
      all.onsuccess = () => resolve(all.result[0].blob.size)
    }
  })`)
  expect(stored).toBeLessThanOrEqual(100 * 1024)

  await page.goto('/?yours=1')
  const card = page.getByRole('link', { name: /Cherry Limeade · soda water/ })
  await expect(card.locator('img')).toHaveCount(1)
  await page.reload()
  await expect(card.locator('img')).toHaveCount(1)

  await card.click()
  await page.getByRole('link', { name: 'Edit this drink' }).click()
  await page.getByRole('button', { name: 'Remove photo' }).click()
  await expect(page.getByText('No photo')).toBeVisible()
  await save(page)
  await page.goto('/?yours=1')
  await expect(card.locator('img')).toHaveCount(0)
  await expect(card.locator('svg')).toHaveCount(1)
})
