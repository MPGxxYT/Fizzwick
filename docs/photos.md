# House Spec photos

Each House Drink has one photo of its House Spec. Until a Drink has one, the app shows its glass drawn in the House Spec's colors, so photos can be added one at a time as the drinks get made.

The photo only appears on the Drink list card, at 68 by 80 pixels on a phone, a little taller than wide. The Drink page doesn't show it. At that size the glass and the drink's color are what people see; small details won't show.

## Taking the photo

The photos are taken weeks apart, so keeping these the same each time makes them look like one set:

- **Background.** The same plain surface and wall each time, nothing busy behind the glass.
- **Light.** The same spot, ideally by a window in daylight. No flash: it puts a white glare on the glass.
- **Angle.** Straight on, with the camera a little above the rim so the top of the drink shows.
- **Framing.** The glass in the middle, with some space above the garnish and below the base. The script crops from the centre, so anything near the edges of a landscape photo is cut.
- **Garnish.** Turned toward the camera.
- **Portrait.** Hold the phone upright. A landscape photo works, but it loses most of its width to the crop.

On an iPhone, set Settings > Camera > Formats to "Most Compatible" so photos save as JPEG. The script can't read HEIC.

## Adding it to the app

1. Copy the photo to the PC.
2. Run the script with the Drink's ID (its file name in `src/house-drinks/`, without `.json`):

   ```bash
   npm run photo -- ginger-mule path/to/photo.jpg
   ```

   It crops the photo to the card's shape, resizes it, compresses it under the 100 KB budget and saves it as `public/photos/ginger-mule.jpg`, the path the Drink file already names. It follows the phone's rotation and drops the photo's metadata, including the location the phone saved with it.
3. Run `npm run dev` and look at the Drink list at phone width. If the glass sits off-centre or the crop cuts the garnish, retake the photo with more space around the glass, or crop the original by hand toward the shape of the card and run the script again.
4. Commit the photo. `npm run check:photos` runs in CI and fails if a photo is over 100 KB.
5. Tick the Drink off in issue #15.

## New House Drinks

A new Drink file's `photo` is `photos/<its id>.jpg` (a test checks this). Add the Drink to the checklist in #15, and it shows the glass drawing until its photo is added the same way.
