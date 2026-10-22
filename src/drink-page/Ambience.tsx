import { useEffect, useRef, useState } from 'react'
import type { Drink, Picks } from '../riff-engine'
import './ambience.css'

// Background bubbles. Fixed spots so they don't jump on every render. Each
// rises from its spot on the page (not the screen) to past the top, taking
// longer the farther it has to go, so they all drift at about the same speed.
const BUBBLES = Array.from({ length: 18 }, (_, i) => {
  const r = (n: number) => (Math.sin(i * 97.3 + n * 13.1) + 1) / 2 // 0..1, repeatable
  const top = Math.round(4 + r(7) * 92) // % down the page
  const duration = Math.round((8 + top * 0.7) * (0.85 + r(3) * 0.3))
  return {
    left: `${Math.round(r(1) * 96)}%`,
    top,
    size: `${(0.35 + r(2) * 0.9).toFixed(2)}rem`,
    duration: `${duration}s`,
    delay: `-${Math.round(r(4) * duration)}s`,
    sway: `${Math.round((r(5) - 0.5) * 50)}px`,
    alpha: (0.15 + r(6) * 0.25).toFixed(2),
  }
})

// Scrolling releases one quick fizz bubble per this many pixels travelled.
const FIZZ_EVERY_PX = 60
const FIZZ_MAX = 24

interface Fizz {
  id: number
  style: React.CSSProperties
}

export function Bubbles() {
  const layer = useRef<HTMLDivElement>(null)
  const [pageHeight, setPageHeight] = useState(0)
  const [fizz, setFizz] = useState<Fizz[]>([])

  // How far a bubble rises depends on how tall the page is.
  useEffect(() => {
    const element = layer.current
    if (!element) return
    setPageHeight(element.offsetHeight)
    const observer = new ResizeObserver(([entry]) => setPageHeight(Math.round(entry.contentRect.height)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let lastY = window.scrollY
    let travelled = 0
    let nextId = 0
    const onScroll = () => {
      travelled += Math.abs(window.scrollY - lastY)
      lastY = window.scrollY
      const count = Math.floor(travelled / FIZZ_EVERY_PX)
      if (count === 0) return
      travelled -= count * FIZZ_EVERY_PX
      const added = Array.from({ length: count }, (): Fizz => {
        const size = 0.25 + Math.random() * 0.5
        // Somewhere in the part of the page on screen, rising to the top edge
        // of the screen at about 200px a second.
        const fromScreenTop = Math.round(window.innerHeight * (0.3 + Math.random() * 0.7))
        return {
          id: nextId++,
          style: {
            left: `${Math.round(Math.random() * 96)}%`,
            top: `${Math.round(window.scrollY + fromScreenTop)}px`,
            width: `${size}rem`,
            height: `${size}rem`,
            '--rise': `${fromScreenTop}px`,
            '--duration': `${Math.max(2, fromScreenTop / (170 + Math.random() * 60)).toFixed(1)}s`,
            '--sway': `${Math.round((Math.random() - 0.5) * 30)}px`,
            '--alpha': (0.3 + Math.random() * 0.25).toFixed(2),
          } as React.CSSProperties,
        }
      })
      setFizz((current) => [...current, ...added].slice(-FIZZ_MAX))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const pop = (id: number) => setFizz((current) => current.filter((bubble) => bubble.id !== id))

  return (
    <div className="dp-bubbles" aria-hidden="true" ref={layer}>
      {fizz.map((bubble) => (
        <span key={`fizz-${bubble.id}`} className="dp-fizz" style={bubble.style} onAnimationEnd={() => pop(bubble.id)} />
      ))}
      {BUBBLES.map((bubble, i) => (
        <span
          key={i}
          style={
            {
              left: bubble.left,
              top: `${bubble.top}%`,
              width: bubble.size,
              height: bubble.size,
              '--duration': bubble.duration,
              '--delay': bubble.delay,
              '--sway': bubble.sway,
              '--alpha': bubble.alpha,
              // From its spot to just past the top of the page.
              '--rise': `${Math.round((pageHeight * bubble.top) / 100) + 32}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

// A pile of ice cubes at the bottom of the page: a back row, higher and
// fainter, and a front row cut off by the page's edge. Fixed spots, like
// the bubbles.
const CUBES = Array.from({ length: 13 }, (_, i) => {
  const r = (n: number) => (Math.sin(i * 61.7 + n * 17.9) + 1) / 2 // 0..1, repeatable
  const back = i % 2 === 1
  return {
    back,
    left: `${Math.round((i / 12) * 100 - 6 + r(1) * 8)}%`,
    bottom: `${(back ? 1.2 : -2) + r(2) * 1.4}rem`,
    size: `${((back ? 3.4 : 4.4) + r(3) * 1.3).toFixed(2)}rem`,
    rot: `${Math.round((r(4) - 0.5) * 50)}deg`,
    // Each cube jiggles on its own clock and in its own direction.
    shake: `${(0.16 + r(5) * 0.1).toFixed(2)}s`,
    dx: `${(r(6) - 0.5) * 6}px`,
    tilt: `${(2 + r(7) * 3).toFixed(1)}deg`,
  }
})

// How long the cubes keep jiggling after the last scroll.
const SETTLE_MS = 220

export function IceCubes() {
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let settle: number | undefined
    const onScroll = () => {
      setShaking(true)
      window.clearTimeout(settle)
      settle = window.setTimeout(() => setShaking(false), SETTLE_MS)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(settle)
    }
  }, [])

  return (
    <div className={`dp-ice${shaking ? ' is-shaking' : ''}`} aria-hidden="true">
      {CUBES.map((cube, i) => (
        <span
          key={i}
          className={cube.back ? 'is-back' : undefined}
          style={
            {
              left: cube.left,
              bottom: cube.bottom,
              width: cube.size,
              height: cube.size,
              '--rot': cube.rot,
              '--shake': cube.shake,
              '--dx': cube.dx,
              '--tilt': cube.tilt,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

// One soft color spot per Slot, each in its own place on the screen, slowly
// breathing. A swap fades the spot to the new Option's color. An empty Slot
// fades its spot out in its last color rather than through grey.
export function ColorSpots({ drink, picks }: { drink: Drink; picks: Picks }) {
  const current: Record<string, string> = {}
  for (const slot of drink.slots) {
    const option = slot.options.find((candidate) => candidate.id === picks[slot.id])
    if (option) current[slot.id] = option.color
  }
  // React's "store information from previous renders" pattern.
  const [lastColors, setLastColors] = useState(current)
  if (Object.entries(current).some(([slotId, color]) => lastColors[slotId] !== color)) {
    setLastColors({ ...lastColors, ...current })
  }

  return (
    <div className="dp-glow" aria-hidden="true">
      {drink.slots.slice(0, 5).map((slot, i) => (
        <div
          key={slot.id}
          className={`dp-spot dp-spot-${i}${current[slot.id] ? ' is-filled' : ''}`}
          style={
            {
              backgroundColor: current[slot.id] ?? lastColors[slot.id] ?? 'transparent',
              // Each spot breathes on its own clock, so they never pulse together.
              '--breathe': `${9 + ((i * 1.7) % 4)}s`,
              '--breathe-delay': `-${(i * 3.1) % 9}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
