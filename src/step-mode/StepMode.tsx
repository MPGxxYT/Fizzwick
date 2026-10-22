import { useEffect, useRef, useState } from 'react'
import { Bubbles, ColorSpots, IceCubes } from '../drink-page/Ambience'
import { hasIceInGlass, isFizzy } from '../drink-page/ambience-for'
import { formatIngredient, glassCount, TOOL_NAMES } from '../drink-page/format'
import { GlassSketch } from '../drink-page/GlassSketch'
import type { Drink, Riff, RiffStep } from '../riff-engine'
import { primeAlarm, soundAlarm } from './alarm'
import {
  formatClock,
  isFinished,
  pauseTimer,
  remainingSeconds,
  resumeTimer,
  startTimer,
  type StepTimer,
} from './timer'
import { useWakeLock } from './wake-lock'
import './step-mode.css'

// A horizontal drag this long, and mostly sideways, counts as a swipe.
const SWIPE_PX = 50
// Taps on the left part of the screen go back; the rest go forward.
const BACK_ZONE = 0.3

// Making the Riff one screen at a time: the Mise en Place first, then one
// step per screen. Covers the Drink page, which stays where it was underneath.
export function StepMode({ drink, riff, onLeave }: { drink: Drink; riff: Riff; onLeave: () => void }) {
  // 0 is the Mise en Place, 1 to steps.length are the steps.
  const [screen, setScreen] = useState(0)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [timer, setTimer] = useState<StepTimer | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const last = riff.steps.length
  const step = screen > 0 ? riff.steps[screen - 1] : null

  useWakeLock()

  const go = (next: number) => {
    if (next < 0 || next > last || next === screen) return
    setDirection(next > screen ? 'forward' : 'back')
    setScreen(next)
  }

  // Latest values for the listeners below, which are added once.
  const latest = useRef({ go, screen, onLeave })
  useEffect(() => {
    latest.current = { go, screen, onLeave }
  })

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const { go, screen, onLeave } = latest.current
      if (event.key === 'ArrowRight') go(screen + 1)
      else if (event.key === 'ArrowLeft') go(screen - 1)
      else if (event.key === 'Escape') onLeave()
    }
    window.addEventListener('keydown', onKey)
    // The Drink page underneath shouldn't scroll.
    const root = document.documentElement
    const overflow = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      root.style.overflow = overflow
    }
  }, [])

  // While a timer runs, tick the clock and ring when it reaches zero. A
  // finished timer is kept paused at zero, so it shows "Time's up".
  useEffect(() => {
    if (!timer || timer.endsAt === null) return
    const tick = () => {
      const time = Date.now()
      setNow(time)
      if (isFinished(timer, time)) {
        soundAlarm()
        setTimer(pauseTimer(timer, time))
      }
    }
    const interval = window.setInterval(tick, 250)
    return () => window.clearInterval(interval)
  }, [timer])

  const timerControls = {
    start: (stepId: string, seconds: number) => {
      primeAlarm()
      const time = Date.now()
      setNow(time)
      setTimer(startTimer(stepId, seconds, time))
    },
    pause: () => timer && setTimer(pauseTimer(timer, Date.now())),
    resume: () => {
      const time = Date.now()
      setNow(time)
      if (timer) setTimer(resumeTimer(timer, time))
    },
    clear: () => setTimer(null),
  }

  // Swipes and taps on the screen itself. Buttons and links handle their own.
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)
  const stageHandlers = {
    onPointerDown: (event: React.PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY }
      swiped.current = false
    },
    onPointerUp: (event: React.PointerEvent) => {
      const start = pointer.current
      pointer.current = null
      if (!start) return
      const dx = event.clientX - start.x
      const dy = event.clientY - start.y
      if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return
      swiped.current = true
      go(dx < 0 ? screen + 1 : screen - 1)
    },
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      if (swiped.current) {
        swiped.current = false
        return
      }
      if ((event.target as Element).closest('button, a')) return
      const box = event.currentTarget.getBoundingClientRect()
      go(event.clientX - box.left < box.width * BACK_ZONE ? screen - 1 : screen + 1)
    },
  }

  const timerStep = timer ? riff.steps.findIndex((candidate) => candidate.id === timer.stepId) + 1 : 0

  return (
    <div className="dp sm" role="dialog" aria-modal="true" aria-label={`Making ${riff.name}`}>
      <ColorSpots drink={drink} picks={riff.picks} />
      {isFizzy(riff) && <Bubbles />}
      {hasIceInGlass(riff) && <IceCubes />}

      <header className="sm-bar">
        <button type="button" className="sm-leave" onClick={onLeave}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
          Leave
        </button>
        {timer && timerStep !== screen && (
          <button type="button" className="sm-timer-pill" onClick={() => go(timerStep)}>
            {isFinished(timer, now) ? "Time's up" : formatClock(remainingSeconds(timer, now))}
            <span className="sm-visually-hidden">, step {timerStep} timer</span>
          </button>
        )}
        <p className="sm-counter" aria-live="polite">
          {step ? `Step ${screen} of ${last}` : 'Before you start'}
        </p>
      </header>

      <div className="sm-progress" aria-hidden="true">
        {riff.steps.map((candidate, i) => (
          <span key={candidate.id} className={i < screen ? 'is-done' : undefined} />
        ))}
      </div>

      <div className="sm-stage" {...stageHandlers}>
        <div key={screen} className="sm-screen" data-direction={direction}>
          {step ? (
            <StepScreen number={screen} step={step} timer={timer} now={now} controls={timerControls} />
          ) : (
            <MiseEnPlace riff={riff} />
          )}
        </div>
      </div>

      <nav className="sm-nav" aria-label="Steps">
        {screen > 0 && (
          <button type="button" className="sm-back" aria-label="Previous step" onClick={() => go(screen - 1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
        )}
        {screen < last ? (
          <button type="button" className="sm-next" onClick={() => go(screen + 1)}>
            {screen === 0 ? 'Start' : 'Next step'}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <button type="button" className="sm-next" onClick={onLeave}>
            Done
          </button>
        )}
      </nav>
    </div>
  )
}

function MiseEnPlace({ riff }: { riff: Riff }) {
  const { glass, glassCount: count, tools, ingredients } = riff.miseEnPlace
  return (
    <section className="sm-mise" aria-labelledby="sm-mise-heading">
      <h2 id="sm-mise-heading">Mise en Place</h2>
      <p className="sm-lead">Set all of this out before the first step.</p>

      <div className="sm-glass">
        <GlassSketch glass={glass} colors={riff.colors} />
        <p>{glassCount(glass, count)}</p>
      </div>

      {tools.length > 0 && (
        <>
          <h3 id="sm-tools-heading">Tools</h3>
          <ul className="sm-tools" aria-labelledby="sm-tools-heading">
            {tools.map((tool) => (
              <li key={tool}>{TOOL_NAMES[tool]}</li>
            ))}
          </ul>
        </>
      )}

      <h3 id="sm-ingredients-heading">Ingredients</h3>
      <ul className="dp-ingredients sm-ingredients" aria-labelledby="sm-ingredients-heading">
        {ingredients.map((ingredient, i) => {
          const { measure, name } = formatIngredient(ingredient)
          return (
            <li key={i}>
              <span className="dp-measure">{measure}</span>
              <span>{name}</span>
            </li>
          )
        })}
      </ul>
      {riff.batchNotes.map((note) => (
        <p key={note} className="dp-note">
          {note}
        </p>
      ))}
    </section>
  )
}

interface TimerControls {
  start: (stepId: string, seconds: number) => void
  pause: () => void
  resume: () => void
  clear: () => void
}

function StepScreen({
  number,
  step,
  timer,
  now,
  controls,
}: {
  number: number
  step: RiffStep
  timer: StepTimer | null
  now: number
  controls: TimerControls
}) {
  return (
    <section className="sm-step" aria-labelledby="sm-step-text">
      <p className="sm-number" aria-hidden="true">
        {number}
      </p>
      <h2 id="sm-step-text" className="sm-text">
        {step.text}
      </h2>
      {step.tools.length > 0 && (
        <p className="sm-step-tools">{step.tools.map((tool) => TOOL_NAMES[tool]).join(' · ')}</p>
      )}
      {step.durationSeconds && (
        <StepClock
          step={step}
          seconds={step.durationSeconds}
          timer={timer?.stepId === step.id ? timer : null}
          otherRunning={timer !== null && timer.stepId !== step.id && !isFinished(timer, now)}
          now={now}
          controls={controls}
        />
      )}
    </section>
  )
}

function StepClock({
  step,
  seconds,
  timer,
  otherRunning,
  now,
  controls,
}: {
  step: RiffStep
  seconds: number
  timer: StepTimer | null
  otherRunning: boolean
  now: number
  controls: TimerControls
}) {
  if (!timer) {
    return (
      <div className="sm-clock">
        <button type="button" className="sm-clock-start" onClick={() => controls.start(step.id, seconds)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2.5 2.5M9.5 2.5h5" />
          </svg>
          Start {formatClock(seconds)} timer
        </button>
        {otherRunning && <p className="sm-clock-note">This replaces the timer that is running.</p>}
      </div>
    )
  }

  const left = remainingSeconds(timer, now)
  const done = isFinished(timer, now)
  const running = timer.endsAt !== null
  return (
    <div className={`sm-clock${done ? ' is-done' : ''}`}>
      <p className="sm-clock-time" role="timer" aria-live={done ? 'assertive' : 'off'}>
        {done ? "Time's up" : formatClock(left)}
      </p>
      <div
        className="sm-clock-bar"
        aria-hidden="true"
        style={{ '--left': left / timer.totalSeconds } as React.CSSProperties}
      />
      <div className="sm-clock-actions">
        {done ? (
          <button type="button" onClick={() => controls.start(step.id, seconds)}>
            Again
          </button>
        ) : running ? (
          <button type="button" onClick={controls.pause}>
            Pause
          </button>
        ) : (
          <button type="button" onClick={controls.resume}>
            Resume
          </button>
        )}
        <button type="button" onClick={controls.clear}>
          {done ? 'Dismiss' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}
