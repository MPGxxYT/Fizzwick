// Turns a phone photo into a Drink's House Spec photo: crops it from the
// centre to the shape of the Drink list card, resizes it and saves it as a
// JPEG under the 100 KB budget that check-photos.mjs enforces, at the path
// the Drink file names. Uses the Playwright Chromium already installed for
// the e2e tests, so it reads whatever Chrome reads (JPEG, PNG, WebP, not
// HEIC) and follows the phone's rotation. Re-encoding drops the photo's
// metadata, including the location the phone saved with it.
//
// Usage: node scripts/prep-photo.mjs <drink-id> <photo>
//    or: npm run photo -- <drink-id> <photo>
import { chromium } from '@playwright/test'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'

const DIR = 'src/house-drinks'
const BUDGET_BYTES = 100 * 1024 // Same budget as check-photos.mjs.
// The card shows the photo at 68 by 80 CSS pixels (drink-list.css). This is
// that shape at enough pixels to stay sharp on any phone screen.
const WIDTH = 510
const HEIGHT = 600
const QUALITIES = [0.85, 0.75, 0.65, 0.55, 0.45]
const TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }

function fail(message) {
  console.error(message)
  process.exit(1)
}

const [id, input] = process.argv.slice(2)
if (!id || !input) fail('Usage: npm run photo -- <drink-id> <photo>')

const drinkFile = join(DIR, `${id}.json`)
if (!existsSync(drinkFile)) fail(`No House Drink called "${id}". The ID is the Drink file's name in ${DIR}, without .json.`)
if (!existsSync(input)) fail(`Can't find the photo ${input}.`)

const extension = extname(input).toLowerCase()
if (extension === '.heic' || extension === '.heif') {
  fail('This is a HEIC photo, which Chrome can\'t read. Export it as JPEG first, or set the iPhone camera to "Most Compatible".')
}
const type = TYPES[extension]
if (!type) fail(`Can't read ${extension} files. Use a JPEG, PNG or WebP photo.`)

const output = join('public', JSON.parse(readFileSync(drinkFile, 'utf8')).photo)

const browser = await chromium.launch()
const page = await browser.newPage()
let result
try {
  result = await page.evaluate(
    async ({ base64, type, width, height, qualities, budget }) => {
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
      const image = await createImageBitmap(new Blob([bytes], { type }), { imageOrientation: 'from-image' })
      // Crop from the centre, like object-fit: cover.
      const scale = Math.max(width / image.width, height / image.height)
      const cropWidth = width / scale
      const cropHeight = height / scale
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      context.imageSmoothingQuality = 'high'
      context.drawImage(
        image,
        (image.width - cropWidth) / 2,
        (image.height - cropHeight) / 2,
        cropWidth,
        cropHeight,
        0,
        0,
        width,
        height,
      )
      let jpeg
      for (const quality of qualities) {
        jpeg = canvas.toDataURL('image/jpeg', quality).split(',')[1]
        if ((jpeg.length * 3) / 4 <= budget) return { jpeg, quality, original: [image.width, image.height] }
      }
      return { jpeg, quality: null, original: [image.width, image.height] }
    },
    {
      base64: readFileSync(input).toString('base64'),
      type,
      width: WIDTH,
      height: HEIGHT,
      qualities: QUALITIES,
      budget: BUDGET_BYTES,
    },
  )
} catch {
  fail(`Chrome couldn't read ${input} as an image.`)
} finally {
  await browser.close()
}

if (result.quality === null) fail(`Couldn't get the photo under ${BUDGET_BYTES / 1024} KB. Try a photo with a plainer background.`)

const jpeg = Buffer.from(result.jpeg, 'base64')
mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, jpeg)
console.log(
  `${output}: ${WIDTH} by ${HEIGHT}, ${Math.round(jpeg.length / 1024)} KB ` +
    `(cropped from ${result.original.join(' by ')}, quality ${result.quality}).`,
)
