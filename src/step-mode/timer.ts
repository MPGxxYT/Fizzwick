// A countdown for one timed step. Pure: every function takes the current
// time in milliseconds, so the clock lives in the component.

export interface StepTimer {
  stepId: string
  totalSeconds: number
  // When it reaches zero while running, or null while paused.
  endsAt: number | null
  // Time left while paused.
  pausedMs: number
}

export function startTimer(stepId: string, seconds: number, now: number): StepTimer {
  return { stepId, totalSeconds: seconds, endsAt: now + seconds * 1000, pausedMs: 0 }
}

export function pauseTimer(timer: StepTimer, now: number): StepTimer {
  if (timer.endsAt === null) return timer
  return { ...timer, endsAt: null, pausedMs: Math.max(0, timer.endsAt - now) }
}

export function resumeTimer(timer: StepTimer, now: number): StepTimer {
  if (timer.endsAt !== null) return timer
  return { ...timer, endsAt: now + timer.pausedMs, pausedMs: 0 }
}

function remainingMs(timer: StepTimer, now: number): number {
  return timer.endsAt === null ? timer.pausedMs : Math.max(0, timer.endsAt - now)
}

// Whole seconds left, rounded up, so the clock shows 0:00 only at the end.
export function remainingSeconds(timer: StepTimer, now: number): number {
  return Math.ceil(remainingMs(timer, now) / 1000)
}

export function isFinished(timer: StepTimer, now: number): boolean {
  return remainingMs(timer, now) === 0
}

// 240 -> "4:00", 12 -> "0:12"
export function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
