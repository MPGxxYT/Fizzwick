import { useId } from 'react'
import { GLASS_SHAPES, type GlassShape } from '../drink-page/glass-shapes'
import { GlassSketch } from '../drink-page/GlassSketch'
import type { Riff } from '../riff-engine'
import { ICE_SECONDS, type FinishShow as Show, type Garnish, type IceKind } from './finish-show'
import './finish-show.css'

// When each part of the show starts, in seconds, before that shift. The
// pour and the making beat run first, then the body effect, then the
// garnish goes on; the cheer follows in step-mode.css.
const BODY_AT = 1.35
// Fizz comes out as the pour reaches the top (it ends at 1.3s), the way a
// fizzy drink bubbles up the moment the glass is full.
const FIZZ_AT = 1.15
const GARNISH_AT = 1.85
const SECOND_GARNISH_AT = 2.15

// Bubbles that burst out of a fizzy drink: spread across its mouth, each with
// its own size, drift, height and delay. Fixed numbers, so the burst looks
// the same every time and nothing random runs during render.
const BUBBLES = Array.from({ length: 16 }, (_, i) => {
  const spread = ((i * 0.618034) % 1) - 0.5
  return {
    left: 50 + spread * 46,
    size: 0.45 + ((i * 0.37) % 1) * 0.75,
    drift: Math.round(spread * 70 + (i % 3) * 8 - 8),
    // Short enough to pop below the top of the finish screen, which clips.
    rise: 60 + ((i * 0.53) % 1) * 55,
    delay: FIZZ_AT + ((i * 0.29) % 1) * 0.3,
  }
})

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` })

// Fixed fractions, so the ice lands the same way every time.
const scatter = (i: number, step: number) => (i * step) % 1

// The same glass with its rim corner on the left. The glasses are drawn
// symmetric, so the left corner mirrors the right one.
const mirrored = (shape: GlassShape): GlassShape => ({ ...shape, rim: { ...shape.rim, x: 120 - shape.rim.x } })

// The finished drink, served in the order it's made: ice into the empty
// glass, the pour, something happening in the glass, and the garnish last.
// See finish-show.ts for which drink gets what. Everything ends in its
// finished place, so without motion the drink simply sits there, complete.
export function FinishShow({ riff, show }: { riff: Riff; show: Show }) {
  const shift = show.ice ? ICE_SECONDS : 0
  const shape = GLASS_SHAPES[riff.glass]
  const ids = useId()
  const liquidClip = `${ids}-liquid`
  const glassClip = `${ids}-glass`
  const frost = `${ids}-frost`
  const shine = `${ids}-shine`
  const drink = `${ids}-drink`
  const level = `${ids}-level`
  const belowSurface = `${ids}-below`
  const { y: top, left, right, bottom } = shape.surface
  const middle = (left + right) / 2
  // The slush on a blended drink takes the color at the top of the drink:
  // the first color, since a blended drink is mixed top to bottom like the
  // glass drawing.
  const slushColor = show.layers[0] ?? '#fbf6ff'
  // The heap above the rim: three lumps, the middle one tallest. The glasses
  // are drawn symmetric, so the rim's left corner mirrors its right one.
  const rimLeft = 120 - shape.rim.x
  const rimWidth = shape.rim.x - rimLeft
  const slushCap = (() => {
    const y = shape.rim.y + 1
    const at = (t: number) => rimLeft + rimWidth * t
    return `M${at(0) - 1} ${y} C${at(0)} ${y - 8} ${at(0.2)} ${y - 12} ${at(0.33)} ${y - 8} C${at(0.4)} ${y - 16} ${at(0.62)} ${y - 16} ${at(0.68)} ${y - 8} C${at(0.8)} ${y - 12} ${at(1)} ${y - 8} ${at(1) + 1} ${y} Z`
  })()
  // The drink's level: a wavy line, wider than the glass so it can roll
  // sideways, with everything below it showing. It rises from under the
  // glass to the liquid line, where the glass shape flattens the wave.
  const waveFrom = left - 40
  const levelShape = `M${waveFrom} ${top} q5 -2.5 10 0${' t10 0'.repeat(Math.ceil((right - left + 80) / 10))} V${bottom + 12} H${waveFrom} Z`

  return (
    <div
      className={`fs is-${show.method} is-${show.body}`}
      style={{ '--shift': `${shift}s` } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="fs-main">
        <GlassSketch glass={riff.glass} colors={riff.colors} className="fs-glass" />
        <svg className="fs-over" viewBox="0 0 120 160">
          <defs>
            {/* The drink fills the glass's own outline, from the liquid line
                down to the bottom of the bowl, so it meets the walls. */}
            <clipPath id={belowSurface}>
              <rect x="0" y={top} width="120" height={bottom - top} />
            </clipPath>
            <clipPath id={liquidClip} clipPath={`url(#${belowSurface})`}>
              <path d={shape.outline[0]} />
            </clipPath>
            <clipPath id={glassClip}>
              <path d={shape.outline[0]} />
            </clipPath>
            <pattern id={frost} width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="0.8" fill="#fbf6ff" />
              <circle cx="4.5" cy="4" r="0.5" fill="#fbf6ff" />
            </pattern>
            <clipPath id={level}>
              <path className="fs-level" d={levelShape} style={{ '--fill': `${bottom - top + 6}px` } as React.CSSProperties} />
            </clipPath>
            <linearGradient id={drink} x1="0" y1={top} x2="0" y2={bottom} gradientUnits="userSpaceOnUse">
              {(show.layers.length > 0 ? show.layers : ['#bfaedc']).map((color, i, all) => (
                <stop key={i} offset={all.length === 1 ? 0 : i / (all.length - 1)} stopColor={color} />
              ))}
            </linearGradient>
            <linearGradient id={shine} x1="0" x2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* The pour: the level rises from the bottom like water, its
              surface rolling, showing the drink beneath it. A built drink
              shows its layers, first Slot at the bottom. */}
          <g clipPath={`url(#${liquidClip})`} opacity="0.75">
            <g clipPath={`url(#${level})`}>
              {show.method === 'build' && show.layers.length > 0 ? (
                show.layers.map((color, i) => {
                  const height = (bottom - top) / show.layers.length
                  return (
                    <rect key={i} x="0" y={bottom - (i + 1) * height} width="120" height={height + 1} fill={color} />
                  )
                })
              ) : (
                <rect x="0" y={top - 4} width="120" height={bottom - top + 8} fill={`url(#${drink})`} />
              )}
            </g>
          </g>

          {/* The ice, drawn over the drink so it shows through it. */}
          {show.ice && <IceFill kind={show.ice} shape={shape} clip={glassClip} />}

          {/* The glass outline again, over the drink and ice, so the walls
              stay crisp where the drink meets them. */}
          {shape.outline.map((d) => (
            <path
              key={d}
              d={d}
              fill="none"
              stroke="rgba(251, 246, 255, 0.9)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* The making beat. */}
          {show.method === 'shake' && (
            <rect className="fs-frost" width="120" height="160" fill={`url(#${frost})`} clipPath={`url(#${glassClip})`} />
          )}
          {show.method === 'dry-shake' && (
            <g className="fs-foam">
              <rect x={left + 1} y={top - 5} width={right - left - 2} height="10" rx="5" fill="#fbf6ff" />
              {[0.25, 0.45, 0.7].map((at) => (
                <circle key={at} cx={left + (right - left) * at} cy={top - 1} r="1.4" fill="#e8dcf5" />
              ))}
            </g>
          )}
          {(show.method === 'stir' || show.method === 'blend') && (
            <g clipPath={`url(#${liquidClip})`}>
              <g className={show.method === 'blend' ? 'fs-swirl is-fast' : 'fs-swirl'}>
                <ellipse cx={middle} cy={(top + bottom) / 2} rx={(right - left) * 0.32} ry="6" />
                <ellipse cx={middle} cy={(top + bottom) / 2 + 12} rx={(right - left) * 0.2} ry="4" />
              </g>
            </g>
          )}
          {/* Blended: slush fills the glass to the rim and heaps over it in
              a few lumps, paler than the drink below, flecked with ice. */}
          {show.method === 'blend' && (
            <g className="fs-peak">
              <rect
                x="0"
                y={shape.rim.y}
                width="120"
                height={top - shape.rim.y + 1}
                clipPath={`url(#${glassClip})`}
                style={{ fill: `color-mix(in srgb, ${slushColor} 55%, #fbf6ff)` }}
              />
              <path d={slushCap} style={{ fill: `color-mix(in srgb, ${slushColor} 55%, #fbf6ff)` }} />
              {[0.2, 0.36, 0.5, 0.64, 0.8, 0.44, 0.58, 0.28, 0.72].map((at, i) => (
                <circle
                  key={i}
                  cx={rimLeft + (shape.rim.x - rimLeft) * at}
                  cy={shape.rim.y - 4 + ((i * 7) % 16)}
                  r={0.9 + (i % 3) * 0.3}
                  fill="#fbf6ff"
                  opacity="0.85"
                />
              ))}
            </g>
          )}

          {/* The body effect. */}
          {/* The clip sits on a still group around the moving shine, so the
              shine slides across the drink while the clip stays on the glass. */}
          {show.body === 'shimmer' && (
            <g clipPath={`url(#${liquidClip})`}>
              <rect
                className="fs-shimmer"
                x={left - 24}
                y={top - 30}
                width="18"
                height={bottom - top + 30}
                fill={`url(#${shine})`}
              />
            </g>
          )}
          {show.body === 'clink' && (
            <g className="fs-sparkle" style={delay(shift + BODY_AT + 0.45)}>
              {[-40, 0, 40].map((angle) => (
                <line
                  key={angle}
                  x1={shape.rim.x + 3}
                  y1={shape.rim.y - 4}
                  x2={shape.rim.x + 3}
                  y2={shape.rim.y - 13}
                  transform={`rotate(${angle} ${shape.rim.x + 3} ${shape.rim.y - 4})`}
                  stroke="#fbf6ff"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              ))}
            </g>
          )}

          {/* The garnish, last. */}
          {show.garnishes.map((garnish, i) => (
            <GarnishDrawing
              key={garnish.kind}
              garnish={garnish}
              // Clinking coupes touch at the right rim, so the garnish goes
              // on the outer one.
              shape={show.body === 'clink' ? mirrored(shape) : shape}
              at={shift + (i === 0 ? GARNISH_AT : SECOND_GARNISH_AT)}
            />
          ))}
        </svg>

        {show.body === 'fizz' &&
          BUBBLES.map((bubble, i) => (
            <span
              key={i}
              className="fs-bubble"
              style={
                {
                  left: `${bubble.left}%`,
                  top: `${(top / 160) * 100}%`,
                  width: `${bubble.size}rem`,
                  height: `${bubble.size}rem`,
                  '--bubble': show.layers[i % show.layers.length] ?? '#fbf6ff',
                  '--drift': `${bubble.drift}px`,
                  '--rise': `${bubble.rise}px`,
                  animationDelay: `${shift + bubble.delay}s`,
                } as React.CSSProperties
              }
            />
          ))}
      </div>

      {show.body === 'clink' && (
        <div className="fs-partner">
          <GlassSketch glass={riff.glass} colors={riff.colors} className="fs-glass" />
        </div>
      )}
    </div>
  )
}

// The glass filling with ice before anything is poured, bottom first: cubes
// stacked to the top, a heap of crushed ice, or one large cube on the bottom.
function IceFill({ kind, shape, clip }: { kind: IceKind; shape: GlassShape; clip: string }) {
  const { y: top, left, right, bottom } = shape.surface
  const width = right - left
  // Each piece starts above the rim, so it falls the whole way in.
  const fall = (y: number) => ({ '--from': `${Math.round(shape.rim.y - 24 - y)}px` })

  let pieces: { x: number; y: number; size: number; turn: number }[]
  if (kind === 'large') {
    const size = Math.min(width * 0.62, (bottom - top) * 0.8)
    pieces = [{ x: (left + right) / 2, y: bottom - size / 2 - 2, size, turn: -4 }]
  } else if (kind === 'crushed') {
    const count = Math.round((width * (bottom - top)) / 120)
    pieces = Array.from({ length: count }, (_, i) => ({
      x: left + 3 + scatter(i, 0.618034) * (width - 6),
      y: bottom - 3 - (i / count) * (bottom - top + 2) + scatter(i, 0.37) * 4,
      size: 5.5 + scatter(i, 0.53) * 3,
      turn: Math.round(scatter(i, 0.29) * 90 - 45),
    }))
  } else {
    // As big as two fit side by side, stacked from the bottom to just above
    // the liquid line, each row nudged over from the last.
    const size = Math.min(18, width * 0.42)
    const columns = Math.max(1, Math.floor(width / (size * 1.05)))
    const step = size * 0.9
    pieces = []
    for (let row = 0; bottom - 2 - (row + 0.5) * step > top - size * 0.3; row++) {
      for (let column = 0; column < columns; column++) {
        const i = row * columns + column
        pieces.push({
          x: left + ((column + 0.5) / columns) * width + (row % 2 ? size * 0.18 : -size * 0.18),
          y: bottom - 2 - (row + 0.5) * step,
          size,
          turn: Math.round(scatter(i, 0.618034) * 36 - 18),
        })
      }
    }
  }

  // Pieces fall in bottom first, all of them within ICE_SECONDS.
  const gap = (ICE_SECONDS - 0.4) / Math.max(1, pieces.length - 1)
  return (
    <g clipPath={`url(#${clip})`}>
      {pieces.map((piece, i) => (
        <g
          key={i}
          className="fs-ice"
          style={{ ...fall(piece.y), animationDelay: `${0.05 + i * gap}s` } as React.CSSProperties}
        >
          <g transform={`rotate(${piece.turn} ${piece.x} ${piece.y})`}>
            <rect
              x={piece.x - piece.size / 2}
              y={piece.y - piece.size / 2}
              width={piece.size}
              height={piece.size * (kind === 'crushed' ? 0.8 : 1)}
              rx={piece.size * (kind === 'crushed' ? 0.35 : 0.2)}
              fill="rgba(235, 245, 255, 0.2)"
              stroke="rgba(235, 245, 255, 0.75)"
              strokeWidth={kind === 'crushed' ? 0.8 : 1.2}
            />
            {kind !== 'crushed' && (
              <path
                d={`M${piece.x - piece.size * 0.28} ${piece.y - piece.size * 0.22} l${piece.size * 0.22} -${piece.size * 0.06}`}
                stroke="rgba(255, 255, 255, 0.65)"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            )}
          </g>
        </g>
      ))}
    </g>
  )
}

// One garnish, drawn at its place on the glass and moving there its own way.
function GarnishDrawing({ garnish, shape, at }: { garnish: Garnish; shape: GlassShape; at: number }) {
  const { rim } = shape
  const { y: top, left, right } = shape.surface
  const middle = (left + right) / 2
  const { color } = garnish

  switch (garnish.kind) {
    // A citrus wheel rolls in and settles on the rim.
    case 'wheel':
      return (
        <g transform={`translate(${rim.x - 4} ${rim.y + 1})`}>
          <g className="fs-roll" style={delay(at)}>
            <circle r="10" fill={color} stroke="rgba(251, 246, 255, 0.85)" strokeWidth="1.2" />
            <circle r="7.6" fill="rgba(255, 255, 255, 0.35)" />
            {[0, 60, 120].map((angle) => (
              <line key={angle} x1="-7" y1="0" x2="7" y2="0" transform={`rotate(${angle})`} stroke={color} strokeWidth="1.1" />
            ))}
          </g>
        </g>
      )
    // A wedge slips onto the rim the same way, rind up.
    case 'wedge':
      return (
        <g transform={`translate(${rim.x - 3} ${rim.y})`}>
          <g className="fs-roll" style={delay(at)}>
            <path d="M-10 0 A10 10 0 0 0 10 0 Z" fill={color} stroke="rgba(251, 246, 255, 0.85)" strokeWidth="1.2" />
            <path d="M-7 0.5 A7 7 0 0 0 7 0.5" fill="none" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.2" />
          </g>
        </g>
      )
    // A cherry drops in and rings the surface.
    case 'cherry':
      return (
        <g>
          <ellipse className="fs-ripple" cx={middle + 6} cy={top + 1} rx="9" ry="2.2" style={delay(at + 0.32)} />
          <g transform={`translate(${middle + 6} ${top + 1})`}>
            <g className="fs-drop" style={delay(at)}>
              <path d="M0 -5 Q2 -14 9 -18" fill="none" stroke="#6b3f1d" strokeWidth="1.4" strokeLinecap="round" />
              <circle r="5.5" fill={color} />
              <circle cx="-1.8" cy="-1.8" r="1.5" fill="rgba(255, 255, 255, 0.5)" />
            </g>
          </g>
        </g>
      )
    // A herb sprig tucks in at the top, leaves giving a little wiggle.
    case 'sprig':
      return (
        <g transform={`translate(${left + (right - left) * 0.28} ${top + 4})`}>
          <g className="fs-tuck" style={delay(at)}>
            <path d="M0 6 L6 -26" stroke="#2f6b3a" strokeWidth="1.4" strokeLinecap="round" />
            <g className="fs-leaves" style={delay(at + 0.35)}>
              {[
                [5, -24, -30],
                [3, -15, 35],
                [4.5, -18, -40],
                [1.5, -6, 30],
              ].map(([x, y, angle], i) => (
                <ellipse key={i} cx={x} cy={y} rx="2.6" ry="5.2" fill={color} transform={`rotate(${angle} ${x} ${y})`} />
              ))}
            </g>
          </g>
        </g>
      )
    // An expressed peel twists over the rim with a mist of oil.
    case 'peel':
      return (
        <g>
          <path
            className="fs-peel"
            d={`M${rim.x - 18} ${rim.y + 1} C${rim.x - 10} ${rim.y - 12} ${rim.x + 4} ${rim.y - 9} ${rim.x - 1} ${rim.y - 2} S${rim.x - 9} ${rim.y - 15} ${rim.x + 2} ${rim.y - 21}`}
            pathLength={1}
            fill="none"
            stroke={color}
            strokeWidth="3.6"
            strokeLinecap="round"
            style={delay(at)}
          />
          {[-14, -6, 2, 8, 13, -18].map((dx, i) => (
            <circle
              key={i}
              className="fs-mist"
              cx={rim.x - 4}
              cy={rim.y - 12}
              r="0.9"
              fill={color}
              style={{ ...delay(at + 0.4), '--dx': `${dx}px`, '--dy': `${-8 - (i % 3) * 5}px` } as React.CSSProperties}
            />
          ))}
        </g>
      )
    // Grated spice dusts down onto the surface.
    case 'dust':
      return (
        <g>
          {Array.from({ length: 12 }, (_, i) => (
            <circle
              key={i}
              className="fs-speck"
              cx={left + 6 + ((right - left - 12) * ((i * 0.618034) % 1))}
              cy={top - 0.5 + (i % 3)}
              r="1.4"
              fill={color}
              style={delay(at + (i % 6) * 0.06)}
            />
          ))}
        </g>
      )
    // A slice of fruit slides onto the rim.
    case 'slice':
      return (
        <g transform={`translate(${rim.x - 2} ${rim.y})`}>
          <g className="fs-slide" style={delay(at)}>
            <path d="M-14 2 Q-4 -18 9 -4 Q-3 -7 -14 2 Z" fill={color} stroke="rgba(251, 246, 255, 0.8)" strokeWidth="1" />
            <circle cx="-3" cy="-6" r="0.8" fill="rgba(60, 30, 20, 0.6)" />
            <circle cx="1" cy="-7" r="0.8" fill="rgba(60, 30, 20, 0.6)" />
          </g>
        </g>
      )
    // A pick spears in at an angle, with its fruit or ginger on it.
    case 'pick': {
      const from = { x: middle - 6, y: top + 14 }
      const to = { x: rim.x + 8, y: rim.y - 22 }
      const along = (t: number) => ({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t })
      const ginger = color === '#e0a43a'
      return (
        <g className="fs-spear" style={delay(at)}>
          <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#e8d7b0" strokeWidth="1.5" strokeLinecap="round" />
          {ginger ? (
            <rect x={along(0.74).x - 4} y={along(0.74).y - 4} width="8" height="8" rx="1.5" fill={color} />
          ) : (
            [0.62, 0.73, 0.84].map((t) => <circle key={t} cx={along(t).x} cy={along(t).y} r="4" fill={color} />)
          )}
        </g>
      )
    }
    // A cinnamon stick, celery stalk or pickle spear stands in the drink,
    // leaning on the rim.
    case 'stick':
      return (
        <g transform={`translate(${left + (right - left) * 0.7} ${top + 10})`}>
          <g className="fs-tuck" style={delay(at)}>
            <rect x="-2.5" y="-38" width="5" height="44" rx="2.5" fill={color} transform="rotate(12)" />
          </g>
        </g>
      )
  }
}
