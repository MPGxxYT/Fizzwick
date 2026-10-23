import type { Glass } from '../riff-engine'

// Outline, liquid area and a shine line for each glass, on a 120 x 160 grid.
// The finish screen also draws on top of them, so each glass says where its
// rim and liquid are: the rim's right corner, and the liquid's top line and
// the inside bottom of the glass.
export interface GlassShape {
  outline: string[]
  liquid: string
  shine: string
  rim: { x: number; y: number }
  surface: { y: number; left: number; right: number; bottom: number }
}

export const GLASS_SHAPES: Record<Glass, GlassShape> = {
  collins: {
    outline: ['M38 12 L82 12 L80 148 L40 148 Z'],
    liquid: 'M40.5 34 L79.5 34 L78.2 145 L41.8 145 Z',
    shine: 'M45 22 L44 130',
    rim: { x: 82, y: 12 },
    surface: { y: 34, left: 40.5, right: 79.5, bottom: 148 },
  },
  highball: {
    outline: ['M32 30 L88 30 L85 148 L35 148 Z'],
    liquid: 'M34.5 48 L85.5 48 L83 145 L37 145 Z',
    shine: 'M40 40 L39 132',
    rim: { x: 88, y: 30 },
    surface: { y: 48, left: 34.5, right: 85.5, bottom: 148 },
  },
  rocks: {
    outline: ['M24 66 L96 66 L91 148 L29 148 Z'],
    liquid: 'M26.5 82 L93.5 82 L89.3 145 L30.7 145 Z',
    shine: 'M32 76 L33 136',
    rim: { x: 96, y: 66 },
    surface: { y: 82, left: 26.5, right: 93.5, bottom: 148 },
  },
  coupe: {
    outline: ['M14 40 L106 40 C104 78 84 92 60 92 C36 92 16 78 14 40 Z', 'M60 92 L60 140', 'M40 148 Q60 138 80 148'],
    liquid: 'M19 48 L101 48 C98 74 82 86 60 86 C38 86 22 74 19 48 Z',
    shine: 'M24 50 Q28 70 40 80',
    rim: { x: 106, y: 40 },
    surface: { y: 48, left: 19, right: 101, bottom: 91 },
  },
  mug: {
    outline: ['M22 40 L86 40 L86 146 Q86 150 82 150 L26 150 Q22 150 22 146 Z', 'M86 62 Q108 62 108 88 Q108 114 86 114'],
    liquid: 'M25 56 L83 56 L83 146 L25 146 Z',
    shine: 'M30 50 L30 138',
    rim: { x: 86, y: 40 },
    surface: { y: 56, left: 25, right: 83, bottom: 150 },
  },
  hurricane: {
    outline: [
      'M40 8 L80 8 Q84 44 72 66 Q96 90 86 120 Q80 134 64 134 L64 140 L80 148 L40 148 L56 140 L56 134 Q40 134 34 120 Q24 90 48 66 Q36 44 40 8 Z',
    ],
    liquid: 'M43 26 L77 26 Q79 46 69 67 Q91 90 82 118 Q77 129 60 129 Q43 129 38 118 Q29 90 51 67 Q41 46 43 26 Z',
    shine: 'M46 18 Q46 44 54 62',
    rim: { x: 80, y: 8 },
    surface: { y: 26, left: 43, right: 77, bottom: 133 },
  },
}
