import { describe, expect, it } from 'vitest'
import { formatClock, isFinished, pauseTimer, remainingSeconds, resumeTimer, startTimer } from './timer'

describe('step timer', () => {
  it('counts down from the step duration', () => {
    const timer = startTimer('shake', 12, 1_000)
    expect(remainingSeconds(timer, 1_000)).toBe(12)
    expect(remainingSeconds(timer, 1_400)).toBe(12) // part of a second left still shows
    expect(remainingSeconds(timer, 4_000)).toBe(9)
    expect(isFinished(timer, 12_999)).toBe(false)
  })

  it('finishes at zero and never goes below it', () => {
    const timer = startTimer('shake', 12, 1_000)
    expect(isFinished(timer, 13_000)).toBe(true)
    expect(remainingSeconds(timer, 60_000)).toBe(0)
  })

  it('stands still while paused and carries on from there when resumed', () => {
    const paused = pauseTimer(startTimer('steep-tea', 240, 0), 40_000)
    expect(remainingSeconds(paused, 40_000)).toBe(200)
    expect(remainingSeconds(paused, 500_000)).toBe(200)
    expect(isFinished(paused, 500_000)).toBe(false)

    const resumed = resumeTimer(paused, 500_000)
    expect(remainingSeconds(resumed, 510_000)).toBe(190)
    expect(isFinished(resumed, 700_000)).toBe(true)
  })

  it('pausing or resuming twice changes nothing', () => {
    const paused = pauseTimer(startTimer('shake', 12, 0), 2_000)
    expect(pauseTimer(paused, 9_000)).toBe(paused)
    const running = startTimer('shake', 12, 0)
    expect(resumeTimer(running, 5_000)).toBe(running)
  })
})

describe('formatClock', () => {
  it('shows minutes and two-digit seconds', () => {
    expect(formatClock(240)).toBe('4:00')
    expect(formatClock(12)).toBe('0:12')
    expect(formatClock(65)).toBe('1:05')
    expect(formatClock(0)).toBe('0:00')
  })
})
