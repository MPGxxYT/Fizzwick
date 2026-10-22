// Option colors are chosen to look like the ingredient, not to read as text.
// These helpers make them readable on the Drink page's night background.

const NIGHT = [0x24, 0x17, 0x3b]
const WHITE = [0xfb, 0xf6, 0xff]

function luminance([r, g, b]: number[]): number {
  const [lr, lg, lb] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}

// The Option color, lightened toward white just until it reaches 4.5:1
// contrast on the night background. Dark colors such as tart cherry juice
// move the most; light ones such as lemon-lime soda not at all.
export function readable(hex: string): string {
  const base = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const night = luminance(NIGHT)
  for (let t = 0; t <= 1; t += 0.05) {
    const mixed = base.map((c, i) => Math.round(c + (WHITE[i] - c) * t))
    if ((luminance(mixed) + 0.05) / (night + 0.05) >= 4.5) return `rgb(${mixed.join(' ')})`
  }
  return `rgb(${WHITE.join(' ')})`
}
