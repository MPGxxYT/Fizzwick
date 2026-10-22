import { useId } from 'react'
import type { Glass } from '../riff-engine'

// Outline, liquid area and a shine line for each glass, on a 120 x 160 grid.
const SKETCHES: Record<Glass, { outline: string[]; liquid: string; shine: string }> = {
  collins: {
    outline: ['M38 12 L82 12 L80 148 L40 148 Z'],
    liquid: 'M40.5 34 L79.5 34 L78.2 145 L41.8 145 Z',
    shine: 'M45 22 L44 130',
  },
  highball: {
    outline: ['M32 30 L88 30 L85 148 L35 148 Z'],
    liquid: 'M34.5 48 L85.5 48 L83 145 L37 145 Z',
    shine: 'M40 40 L39 132',
  },
  rocks: {
    outline: ['M24 66 L96 66 L91 148 L29 148 Z'],
    liquid: 'M26.5 82 L93.5 82 L89.3 145 L30.7 145 Z',
    shine: 'M32 76 L33 136',
  },
  coupe: {
    outline: ['M14 40 L106 40 C104 78 84 92 60 92 C36 92 16 78 14 40 Z', 'M60 92 L60 140', 'M40 148 Q60 138 80 148'],
    liquid: 'M19 48 L101 48 C98 74 82 86 60 86 C38 86 22 74 19 48 Z',
    shine: 'M24 50 Q28 70 40 80',
  },
  mug: {
    outline: ['M22 40 L86 40 L86 146 Q86 150 82 150 L26 150 Q22 150 22 146 Z', 'M86 62 Q108 62 108 88 Q108 114 86 114'],
    liquid: 'M25 56 L83 56 L83 146 L25 146 Z',
    shine: 'M30 50 L30 138',
  },
  hurricane: {
    outline: [
      'M40 8 L80 8 Q84 44 72 66 Q96 90 86 120 Q80 134 64 134 L64 140 L80 148 L40 148 L56 140 L56 134 Q40 134 34 120 Q24 90 48 66 Q36 44 40 8 Z',
    ],
    liquid: 'M43 26 L77 26 Q79 46 69 67 Q91 90 82 118 Q77 129 60 129 Q43 129 38 118 Q29 90 51 67 Q41 46 43 26 Z',
    shine: 'M46 18 Q46 44 54 62',
  },
}

// A line drawing of the glass with the Riff blended smoothly inside it.
export function GlassSketch({ glass, colors, className = 'dp-glass-sketch' }: { glass: Glass; colors: string[]; className?: string }) {
  const gradientId = useId()
  const sketch = SKETCHES[glass]
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
      <path d={sketch.liquid} fill={`url(#${gradientId})`} opacity="0.75" />
      {sketch.outline.map((d) => (
        <path key={d} d={d} fill="none" stroke="rgba(251, 246, 255, 0.9)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      ))}
      <path d={sketch.shine} fill="none" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
