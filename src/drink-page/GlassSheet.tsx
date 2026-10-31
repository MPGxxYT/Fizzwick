import { useState } from 'react'
import { GLASS_SIZES_OZ, type Glass } from '../riff-engine'
import { GLASS_NAMES } from './format'
import { GlassSketch } from './GlassSketch'
import { Sheet } from './Sheet'

const ML_PER_OZ = 30
const MIN_OZ = 2
const MAX_OZ = 64

// What the glass looks like, the size the recipe is written for, and a way to
// use your own glass instead: the pours then scale to fit it.
export function GlassSheet({
  glass,
  colors,
  customOz,
  onCustomOz,
  onClose,
}: {
  glass: Glass
  colors: string[]
  customOz: number | null
  onCustomOz: (oz: number | null) => void
  onClose: () => void
}) {
  const standard = GLASS_SIZES_OZ[glass]
  const [draft, setDraft] = useState(String(customOz ?? standard))
  const draftOz = Number(draft)
  const valid = draft.trim() !== '' && draftOz >= MIN_OZ && draftOz <= MAX_OZ

  return (
    <Sheet label={GLASS_NAMES[glass]} onClose={onClose}>
      <div className="dp-glass-top">
        <GlassSketch glass={glass} colors={colors} />
        <div>
          <h2>{GLASS_NAMES[glass]}</h2>
          <p className="dp-glass-size">{standard} oz</p>
          <p className="dp-glass-sub">About {standard * ML_PER_OZ} ml. The recipe is written for this size.</p>
        </div>
      </div>

      <form
        className="dp-glass-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (!valid) return
          onCustomOz(draftOz === standard ? null : draftOz)
          onClose()
        }}
      >
        <label htmlFor="dp-glass-oz">Using a different glass? Enter its size and the amounts scale to fit.</label>
        <div className="dp-glass-row">
          <input
            id="dp-glass-oz"
            type="number"
            inputMode="decimal"
            min={MIN_OZ}
            max={MAX_OZ}
            step={0.5}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <span>oz</span>
          <button type="submit" className="dp-glass-use" disabled={!valid}>
            Use this size
          </button>
        </div>
        {!valid && (
          <p className="dp-glass-error" role="alert">
            Enter a size from {MIN_OZ} to {MAX_OZ} oz.
          </p>
        )}
        {customOz !== null && (
          <button
            type="button"
            className="dp-glass-standard"
            onClick={() => {
              onCustomOz(null)
              onClose()
            }}
          >
            Back to the standard {standard} oz
          </button>
        )}
      </form>
    </Sheet>
  )
}
