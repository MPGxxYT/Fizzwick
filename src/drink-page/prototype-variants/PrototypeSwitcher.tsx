// PROTOTYPE: throwaway. Floating bar for flipping between look variants.
// Rendered only in dev builds.
import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import type { Riff } from '../../riff-engine'

export interface VariantInfo {
  key: string
  name: string
}

export function PrototypeSwitcher({ variants, current, riff }: { variants: VariantInfo[]; current: string; riff: Riff }) {
  const [params, setParams] = useSearchParams()
  const index = Math.max(0, variants.findIndex((variant) => variant.key === current))

  const go = (step: number) => {
    const next = variants[(index + step + variants.length) % variants.length]
    const updated = new URLSearchParams(params)
    updated.set('variant', next.key)
    setParams(updated, { replace: true })
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable]')) return
      if (event.key === 'ArrowLeft') go(-1)
      if (event.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const state = Object.entries(riff.picks)
    .map(([slot, option]) => `${slot}=${option ?? 'none'}`)
    .join(' ')

  return (
    <div style={bar}>
      <div style={row}>
        <button type="button" style={arrow} onClick={() => go(-1)} aria-label="Previous variant">
          ‹
        </button>
        <strong>
          {variants[index].key}: {variants[index].name}
        </strong>
        <button type="button" style={arrow} onClick={() => go(1)} aria-label="Next variant">
          ›
        </button>
      </div>
      <div style={stateLine}>
        {state} servings={riff.servings} houseSpec={String(riff.isHouseSpec)}
      </div>
    </div>
  )
}

const bar: React.CSSProperties = {
  position: 'fixed',
  bottom: 12,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1000,
  maxWidth: 'calc(100vw - 24px)',
  padding: '6px 12px',
  borderRadius: 16,
  background: '#000',
  color: '#fff',
  font: '13px/1.3 system-ui, sans-serif',
  boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
  textAlign: 'center',
}
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }
const arrow: React.CSSProperties = {
  width: 32,
  height: 32,
  border: 0,
  borderRadius: 16,
  background: '#333',
  color: '#fff',
  fontSize: 20,
  cursor: 'pointer',
}
const stateLine: React.CSSProperties = { marginTop: 2, opacity: 0.7, fontSize: 11, wordBreak: 'break-word' }
