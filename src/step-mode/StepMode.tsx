import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { markBarTerms, type Segment } from '../bar-terms'
import { Bubbles, ColorSpots, IceCubes } from '../drink-page/Ambience'
import { hasIceInGlass, isFizzy } from '../drink-page/ambience-for'
import { formatIngredient, glassCount, TOOL_NAMES } from '../drink-page/format'
import { GlassSketch } from '../drink-page/GlassSketch'
import { TermText } from '../drink-page/TermText'
import { newFavorite, sameRiff } from '../favorites/favorite'
import { favoriteId, putFavorite, useFavorites } from '../favorites/store'
import type { Drink, Riff, RiffStep } from '../riff-engine'
import { primeAlarm, soundAlarm } from './alarm'
import { pickCheers } from './cheers'
import { finishShow, ICE_SECONDS } from './finish-show'
import { FinishShow } from './FinishShow'
import { splitTimedPart, timedPart } from './timed-part'
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

// A drag this long counts as a swipe.
const SWIPE_PX = 50
// On the Mise en Place, taps on the left part of the screen go back and the
// rest go forward. On the steps, taps above the current step go back.
const BACK_ZONE = 0.3
// The height of the fade at the top of the steps, in step-mode.css.
const TOP_FADE_PX = 40

// Making the Riff one screen at a time: the Mise en Place first, then one
// step per screen, then a finish screen. Covers the Drink page, which stays
// where it was underneath.
export function StepMode({ drink, riff, onLeave }: { drink: Drink; riff: Riff; onLeave: () => void }) {
  // 0 is the Mise en Place, 1 to steps.length are the steps, and the one
  // after the last step is the finish.
  const [screen, setScreen] = useState(0)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [timer, setTimer] = useState<StepTimer | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const last = riff.steps.length
  const finish = last + 1
  const step = screen > 0 && screen <= last ? riff.steps[screen - 1] : null

  useWakeLock()

  // Focus comes inside when step mode opens, so a screen reader starts here
  // and keys work at once.
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => root.current?.focus(), [])

  // A fresh cheer each time the finish comes up.
  const [cheers, setCheers] = useState('Cheers!')

  const go = (next: number) => {
    if (next < 0 || next > finish || next === screen) return
    if (next === finish) {
      const picked = pickCheers(lastCheers, Math.random())
      lastCheers = picked
      setCheers(picked)
    }
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
      // Keys in an open Bar Term sheet are the sheet's own.
      if ((event.target as Element | null)?.closest?.('dialog')) return
      const { go, screen, onLeave } = latest.current
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') go(screen + 1)
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') go(screen - 1)
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
  // Sideways swipes work everywhere. On the steps, which don't scroll, an
  // upward swipe brings the next step up and a downward one goes back.
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
      if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) >= Math.abs(dy) * 1.5) {
        swiped.current = true
        go(dx < 0 ? screen + 1 : screen - 1)
      } else if (step && Math.abs(dy) >= SWIPE_PX && Math.abs(dy) >= Math.abs(dx) * 1.5) {
        swiped.current = true
        go(dy < 0 ? screen + 1 : screen - 1)
      }
    },
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      if (swiped.current) {
        swiped.current = false
        return
      }
      // On the finish, a tap skips the show to its end.
      if (screen === finish) {
        event.currentTarget.getAnimations({ subtree: true }).forEach((animation) => animation.finish())
        return
      }
      if ((event.target as Element).closest('button, a')) return
      if (step) {
        const current = event.currentTarget.querySelector('[data-current]')
        go(current && event.clientY < current.getBoundingClientRect().top ? screen - 1 : screen + 1)
        return
      }
      const box = event.currentTarget.getBoundingClientRect()
      go(event.clientX - box.left < box.width * BACK_ZONE ? screen - 1 : screen + 1)
    },
  }

  const timerStep = timer ? riff.steps.findIndex((candidate) => candidate.id === timer.stepId) + 1 : 0

  return (
    <div className="dp sm" role="dialog" aria-modal="true" aria-label={`Making ${riff.name}`} ref={root} tabIndex={-1}>
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
        <p className="sm-counter">{step ? `Step ${screen} of ${last}` : screen === finish ? 'Done' : 'Before you start'}</p>
        {/* Read out in full, so a screen reader hears the step and not just
            its number. */}
        <p className="sm-visually-hidden" aria-live="polite">
          {step
            ? `Step ${screen} of ${last}. ${step.text} ${amountsToRead(step)}`
            : screen === finish
              ? `${cheers} Your ${riff.name} is ready.`
              : ''}
        </p>
      </header>

      <div className="sm-progress" aria-hidden="true">
        {riff.steps.map((candidate, i) => (
          <span key={candidate.id} className={i < screen ? 'is-done' : undefined} />
        ))}
      </div>

      <div className="sm-stage" data-screen={step ? 'steps' : screen === finish ? 'finish' : 'mise'} {...stageHandlers}>
        {step ? (
          <StepStack steps={riff.steps} current={screen - 1} timer={timer} now={now} controls={timerControls} />
        ) : screen === finish ? (
          <div className="sm-screen" data-direction={direction}>
            <Finish riff={riff} cheers={cheers} />
          </div>
        ) : (
          <div className="sm-screen" data-direction={direction}>
            <MiseEnPlace riff={riff} />
          </div>
        )}
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
        ) : screen === last ? (
          <button type="button" className="sm-next" onClick={() => go(finish)}>
            Done
          </button>
        ) : (
          <button type="button" className="sm-next" onClick={onLeave}>
            Back to the drink
          </button>
        )}
      </nav>
    </div>
  )
}

// A step's amounts as a sentence: "¾ oz fresh lime juice, ¾ oz cherry syrup."
function amountsToRead(step: RiffStep): string {
  if (step.ingredients.length === 0) return ''
  const amounts = step.ingredients.map((ingredient) => {
    const { measure, name } = formatIngredient(ingredient)
    return `${measure} ${name}`
  })
  return `${amounts.join(', ')}.`
}

function MiseEnPlace({ riff }: { riff: Riff }) {
  const { glass, glassCount: count, tools, ingredients } = riff.miseEnPlace
  const heading = useMemo(() => markBarTerms(['Mise en Place'])[0], [])
  // Tools, then each ingredient's measure and name, marked as one screen.
  const marked = useMemo(
    () =>
      markBarTerms([
        ...tools.map((tool) => TOOL_NAMES[tool]),
        ...ingredients.flatMap((ingredient) => {
          const { measure, name } = formatIngredient(ingredient)
          return [measure, name]
        }),
      ]),
    [tools, ingredients],
  )
  return (
    <section className="sm-mise" aria-labelledby="sm-mise-heading">
      {/* The heading is a Bar Term too, so it explains itself. */}
      <h2 id="sm-mise-heading">
        <TermText segments={heading} linkToPage={false} />
      </h2>
      <p className="sm-lead">Set all of this out before the first step.</p>

      <div className="sm-glass">
        <GlassSketch glass={glass} colors={riff.colors} />
        <p>{glassCount(glass, count)}</p>
      </div>

      {tools.length > 0 && (
        <>
          <h3 id="sm-tools-heading">Tools</h3>
          <ul className="sm-tools" aria-labelledby="sm-tools-heading">
            {tools.map((tool, i) => (
              <li key={tool}>
                <TermText segments={marked[i]} linkToPage={false} />
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 id="sm-ingredients-heading">Ingredients</h3>
      <ul className="dp-ingredients sm-ingredients" aria-labelledby="sm-ingredients-heading">
        {ingredients.map((_ingredient, i) => (
          <li key={i}>
            <span className="dp-measure">
              <TermText segments={marked[tools.length + i * 2]} linkToPage={false} />
            </span>
            <span>
              <TermText segments={marked[tools.length + i * 2 + 1]} linkToPage={false} />
            </span>
          </li>
        ))}
      </ul>
      {riff.batchNotes.map((note) => (
        <p key={note} className="dp-note">
          {note}
        </p>
      ))}
    </section>
  )
}

// The phrase the finish showed last, so the next one is different.
let lastCheers: string | null = null

// The end of making it: the drink is served in a way that shows how it was
// made (see FinishShow), and a short cheer ("Cheers!", "Ta-da!") pops in. Then a way to keep the Riff,
// since now is when you know whether you liked it.
function Finish({ riff, cheers }: { riff: Riff; cheers: string }) {
  const show = useMemo(() => finishShow(riff), [riff])
  const favorites = useFavorites()
  const [failed, setFailed] = useState(false)
  const saved =
    favorites.status === 'ready' &&
    favorites.favorites.some((favorite) => favorite.drinkId === riff.drinkId && sameRiff(favorite.picks, riff.picks))

  const save = () => {
    setFailed(false)
    putFavorite(newFavorite(riff, favoriteId(), Date.now())).catch(() => setFailed(true))
  }

  return (
    // Drinks with ice spend a moment filling the glass with it, so the cheer
    // waits that much longer too.
    <section
      className="sm-finish"
      aria-labelledby="sm-finish-heading"
      style={{ '--shift': `${show.ice ? ICE_SECONDS : 0}s` } as React.CSSProperties}
    >
      <FinishShow riff={riff} show={show} />
      <h2 id="sm-finish-heading">{cheers}</h2>
      <p className="sm-finish-ready">Your {riff.name} is ready.</p>
      {favorites.status === 'unavailable' || failed ? (
        <p className="sm-lead" role="alert">
          This browser won't keep Favorites.
        </p>
      ) : saved ? (
        <p className="sm-finish-saved">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 6.1 5 5 0 0 1 21.2 11C19 15.6 12 20 12 20z" />
          </svg>
          Saved to Favorites
        </p>
      ) : (
        favorites.status === 'ready' && (
          <>
            <p className="sm-lead">Liked this Riff? Save it to make it again.</p>
            <button type="button" className="sm-clock-start sm-finish-save" onClick={save}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 6.1 5 5 0 0 1 21.2 11C19 15.6 12 20 12 20z" />
              </svg>
              Save to Favorites
            </button>
          </>
        )
      )}
    </section>
  )
}

interface TimerControls {
  start: (stepId: string, seconds: number) => void
  pause: () => void
  resume: () => void
  clear: () => void
}

// How much each step shows, by its place from the current one: the next
// steps fade the farther off they are, and the step just done fades most.
function visibility(distance: number): number {
  if (distance === 0) return 1
  if (distance === -1) return 0.16
  if (distance < -1) return 0
  return [0.5, 0.3][distance - 1] ?? 0.18
}

// Every step in order, the current one near the top. Moving on slides the
// list up, so the next step is always in view before you get to it.
function StepStack({
  steps,
  current,
  timer,
  now,
  controls,
}: {
  steps: RiffStep[]
  current: number
  timer: StepTimer | null
  now: number
  controls: TimerControls
}) {
  const list = useRef<HTMLOListElement>(null)

  // Lines the current step up near the top of the stage, leaving room above
  // for the end of the step before. Measured again if anything changes size.
  useLayoutEffect(() => {
    const element = list.current
    if (!element) return
    const place = () => {
      const item = element.children[current] as HTMLElement | undefined
      const stage = element.parentElement
      if (!item || !stage) return
      // A step too tall to fit above the bottom fade moves up, as far as the
      // top fade, since the stage doesn't scroll.
      const preferred = Math.min(stage.clientHeight * 0.22, 160)
      const height = (item.lastElementChild as HTMLElement).offsetHeight
      const anchor = Math.max(TOP_FADE_PX, Math.min(preferred, stage.clientHeight * 0.8 - height))
      element.style.transform = `translateY(${Math.round(anchor - item.offsetTop)}px)`
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(element)
    return () => observer.disconnect()
  }, [current])

  return (
    <ol className="sm-stack" ref={list}>
      {steps.map((step, i) => (
        <li
          key={step.id}
          className="sm-item"
          data-current={i === current || undefined}
          inert={i !== current}
          aria-hidden={i !== current || undefined}
          style={{ opacity: visibility(i - current) }}
        >
          <StepItem
            number={i + 1}
            step={step}
            current={i === current}
            timer={timer}
            now={now}
            controls={controls}
          />
        </li>
      ))}
    </ol>
  )
}

function StepItem({
  number,
  step,
  current,
  timer,
  now,
  controls,
}: {
  number: number
  step: RiffStep
  current: boolean
  timer: StepTimer | null
  now: number
  controls: TimerControls
}) {
  // The step text, then its tools, then each ingredient's measure and name,
  // marked as one screen.
  const [text, ...rest] = useMemo(
    () =>
      markBarTerms([
        step.text,
        ...step.tools.map((tool) => TOOL_NAMES[tool]),
        ...step.ingredients.flatMap((ingredient) => {
          const { measure, name } = formatIngredient(ingredient)
          return [measure, name]
        }),
      ]),
    [step],
  )
  const tools = rest.slice(0, step.tools.length)
  const amounts = rest.slice(step.tools.length)
  return (
    <>
      <p className="sm-number" aria-hidden="true">
        {number}
      </p>
      <div>
        <h2 className="sm-text">
          <StepText step={step} segments={text} />
        </h2>
        {step.ingredients.length > 0 && (
          <ul className="dp-ingredients sm-step-amounts" aria-label="How much to use">
            {step.ingredients.map((_ingredient, i) => (
              <li key={i}>
                <span className="dp-measure">
                  <TermText segments={amounts[i * 2]} linkToPage={false} />
                </span>
                <span>
                  <TermText segments={amounts[i * 2 + 1]} linkToPage={false} />
                </span>
              </li>
            ))}
          </ul>
        )}
        {tools.length > 0 && (
          <p className="sm-step-tools">
            {tools.map((segments, i) => (
              <Fragment key={i}>
                {i > 0 && ' · '}
                <TermText segments={segments} linkToPage={false} />
              </Fragment>
            ))}
          </p>
        )}
        {step.durationSeconds &&
          (current ? (
            <StepClock
              step={step}
              seconds={step.durationSeconds}
              timer={timer?.stepId === step.id ? timer : null}
              otherRunning={timer !== null && timer.stepId !== step.id && !isFinished(timer, now)}
              now={now}
              controls={controls}
            />
          ) : (
            <p className="sm-step-tools">{formatClock(step.durationSeconds)} timer</p>
          ))}
      </div>
    </>
  )
}

// The step text. In a timed step, the part the timer is for is colored like
// the timer and starts with a small stopwatch, so it's clear what to time.
function StepText({ step, segments }: { step: RiffStep; segments: Segment[] }) {
  const range = step.durationSeconds ? timedPart(step.text) : null
  if (!range) return <TermText segments={segments} linkToPage={false} />
  const { before, timed, after } = splitTimedPart(segments, range)
  return (
    <>
      <TermText segments={before} linkToPage={false} />
      <span className="sm-timed">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 2.5M9.5 2.5h5" />
        </svg>
        <TermText segments={timed} linkToPage={false} />
      </span>
      <TermText segments={after} linkToPage={false} />
    </>
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
