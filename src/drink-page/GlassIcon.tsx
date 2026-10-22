import { useId } from 'react'
import type { Glass } from '../riff-engine'

// Outline and liquid area for each glass, on a 64 x 96 grid.
const SHAPES: Record<Glass, { outline: string; liquid: string }> = {
  collins: {
    outline: 'M18 8 L46 8 L44 90 L20 90 Z',
    liquid: 'M19.6 24 L44.4 24 L43 88 L21 88 Z',
  },
  highball: {
    outline: 'M14 24 L50 24 L47 90 L17 90 Z',
    liquid: 'M15.6 36 L48.4 36 L45.8 88 L18.2 88 Z',
  },
  rocks: {
    outline: 'M10 46 L54 46 L50 90 L14 90 Z',
    liquid: 'M11.8 56 L52.2 56 L48.8 88 L15.2 88 Z',
  },
  coupe: {
    outline: 'M6 30 L58 30 Q56 58 32 60 Q8 58 6 30 Z M32 60 L32 86 M20 90 Q32 84 44 90',
    liquid: 'M9 34 L55 34 Q52 55 32 57 Q12 55 9 34 Z',
  },
  mug: {
    outline: 'M10 30 L46 30 L46 88 L10 88 Z M46 42 Q60 42 60 56 Q60 70 46 70',
    liquid: 'M12 38 L44 38 L44 86 L12 86 Z',
  },
  hurricane: {
    outline:
      'M20 6 L44 6 Q46 30 40 44 Q52 58 46 76 Q42 84 34 84 L34 88 L44 92 L20 92 L30 88 L30 84 Q22 84 18 76 Q12 58 24 44 Q18 30 20 6 Z',
    liquid: 'M22 20 L42 20 Q43 32 38 45 Q49 58 44 74 Q40 81 32 81 Q24 81 20 74 Q15 58 26 45 Q21 32 22 20 Z',
  },
}

// A glass of the Drink's shape, filled with bands in the Riff's colors.
export function GlassIcon({ glass, colors, label }: { glass: Glass; colors: string[]; label: string }) {
  const gradientId = useId()
  const shape = SHAPES[glass]
  const bands = colors.length > 0 ? colors : ['transparent']
  return (
    <svg className="glass-icon" viewBox="0 0 64 96" role="img" aria-label={label}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          {bands.flatMap((color, i) => [
            <stop key={`${i}a`} offset={i / bands.length} stopColor={color} />,
            <stop key={`${i}b`} offset={(i + 1) / bands.length} stopColor={color} />,
          ])}
        </linearGradient>
      </defs>
      <path d={shape.liquid} fill={`url(#${gradientId})`} />
      <path d={shape.outline} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
