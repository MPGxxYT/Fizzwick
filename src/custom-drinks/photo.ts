// A Custom Drink's photo, made on the phone the way scripts/prep-photo.mjs
// makes a House Drink's: cropped from the centre to the Drink list card's
// shape, resized, and saved as a JPEG within the same 100 KB budget. Keep
// these numbers in step with that script. Re-encoding drops the photo's
// metadata, including any location the phone saved with it.
export const PHOTO_WIDTH = 510
export const PHOTO_HEIGHT = 600
export const PHOTO_BUDGET_BYTES = 100 * 1024
const QUALITIES = [0.85, 0.75, 0.65, 0.55, 0.45]

// The part of a photo to keep, like object-fit: cover.
export function coverCrop(width: number, height: number): { x: number; y: number; width: number; height: number } {
  const scale = Math.max(PHOTO_WIDTH / width, PHOTO_HEIGHT / height)
  const cropWidth = PHOTO_WIDTH / scale
  const cropHeight = PHOTO_HEIGHT / scale
  return { x: (width - cropWidth) / 2, y: (height - cropHeight) / 2, width: cropWidth, height: cropHeight }
}

export class PhotoError extends Error {}

// Rejects with a PhotoError the editor can show as it is.
export async function preparePhoto(file: Blob): Promise<Blob> {
  let image: ImageBitmap
  try {
    image = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new PhotoError("Couldn't read that photo. Try a JPEG or PNG.")
  }
  const crop = coverCrop(image.width, image.height)
  const canvas = document.createElement('canvas')
  canvas.width = PHOTO_WIDTH
  canvas.height = PHOTO_HEIGHT
  const context = canvas.getContext('2d')!
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, PHOTO_WIDTH, PHOTO_HEIGHT)
  image.close()

  for (const quality of QUALITIES) {
    const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (jpeg && jpeg.size <= PHOTO_BUDGET_BYTES) return jpeg
  }
  throw new PhotoError("Couldn't make that photo small enough. Try one with a plainer background.")
}
