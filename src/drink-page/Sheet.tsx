import { useEffect, useRef, type ReactNode } from 'react'

// How far down, in pixels, a swipe has to pull the sheet before letting go
// closes it. A quick flick closes it from less.
const CLOSE_DISTANCE = 90
const CLOSE_SPEED = 0.6

// A bottom sheet on the native <dialog>, so focus stays inside it and Escape
// closes it. Mounting it opens it; tapping the backdrop, pressing Escape or
// swiping it down calls onClose. When it goes away, focus returns to whatever
// opened it.
export function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const element = dialog.current
    const opener = document.activeElement as HTMLElement | null
    element?.showModal()
    return () => opener?.focus()
  }, [])

  // Swipe down to close. Only from the top of the sheet's own scroll, so
  // scrolling a long list inside it still works, and only once the finger has
  // clearly moved down, so taps on the choices stay taps.
  useEffect(() => {
    const element = dialog.current
    if (!element) return
    let startY = 0
    let startTime = 0
    let pull = 0
    let dragging = false
    let tracking = false

    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || element.scrollTop > 0) return
      tracking = true
      dragging = false
      pull = 0
      startY = event.touches[0].clientY
      startTime = event.timeStamp
    }

    const onMove = (event: TouchEvent) => {
      if (!tracking) return
      const dy = event.touches[0].clientY - startY
      if (!dragging) {
        if (dy < -6) tracking = false
        if (dy <= 8) return
        dragging = true
        element.classList.add('is-dragging')
      }
      event.preventDefault()
      pull = Math.max(0, dy - 8)
      element.style.transform = `translateY(${pull}px)`
    }

    const onEnd = (event: TouchEvent) => {
      if (!tracking) return
      tracking = false
      if (!dragging) return
      dragging = false
      element.classList.remove('is-dragging')
      const speed = pull / Math.max(1, event.timeStamp - startTime)
      if (pull > CLOSE_DISTANCE || speed > CLOSE_SPEED) {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduced) {
          closeRef.current()
          return
        }
        // Slide the rest of the way out, then close (matches the 0.2s
        // transition on .dp-sheet).
        element.style.transform = 'translateY(100%)'
        window.setTimeout(() => closeRef.current(), 200)
      } else {
        element.style.transform = ''
      }
    }

    element.addEventListener('touchstart', onStart, { passive: true })
    element.addEventListener('touchmove', onMove, { passive: false })
    element.addEventListener('touchend', onEnd)
    element.addEventListener('touchcancel', onEnd)
    return () => {
      element.removeEventListener('touchstart', onStart)
      element.removeEventListener('touchmove', onMove)
      element.removeEventListener('touchend', onEnd)
      element.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  return (
    <dialog
      ref={dialog}
      className="dp-sheet"
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      // The dialog has no padding, so a click that lands on it directly is a
      // click on the backdrop around the content.
      onClick={(event) => {
        if (event.target === dialog.current) onClose()
      }}
    >
      <div className="dp-sheet-handle" aria-hidden="true" />
      <div className="dp-sheet-body">{children}</div>
    </dialog>
  )
}
