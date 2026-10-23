// What the finish screen says, picked fresh each time so it doesn't get
// stale. Short, so each fits on one line at the finish's size.
export const CHEERS = ['Cheers!', 'Hooray!', 'Ta-da!', 'Nailed it!', 'Salud!', 'Bottoms up!', 'Well done!', 'Santé!'] as const

// Picks one, never the one shown last time. `random` is 0 to under 1.
export function pickCheers(last: string | null, random: number): string {
  const choices = CHEERS.filter((phrase) => phrase !== last)
  return choices[Math.floor(random * choices.length)]
}
