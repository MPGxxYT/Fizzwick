import { useId } from 'react'
import type { Glass } from '../riff-engine'
import { GLASS_SHAPES } from './glass-shapes'

// A line drawing of the glass with the Riff blended smoothly inside it.
export function GlassSketch({ glass, colors, className = 'dp-glass-sketch' }: { glass: Glass; colors: string[]; className?: string }) {
  const gradientId = useId()
  const sketch = GLASS_SHAPES[glass]
  const blend = colors.length > 0 ? colors : ['#bfaedc']
  return (
    <svg className={className} viewBox="0 0 120 160" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          {blend.map((color, i) => (
            <stop key={i} offset={blend.length === 1 ? 0 : i / (blend.length - 1)} stopColor={color} />
          ))}
        </linearGradient>
      </defs>
      <path d={sketch.outline[0]} fill="rgba(251, 246, 255, 0.05)" />
      <path className="glass-liquid" d={sketch.liquid} fill={`url(#${gradientId})`} opacity="0.75" />
      {sketch.outline.map((d) => (
        <path key={d} d={d} fill="none" stroke="rgba(251, 246, 255, 0.9)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      ))}
      <path d={sketch.shine} fill="none" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
