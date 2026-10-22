import { useEffect, useRef, type ReactNode } from 'react'

// A bottom sheet on the native <dialog>, so focus stays inside it and Escape
// closes it. Mounting it opens it; tapping the backdrop or pressing Escape
// calls onClose. When it goes away, focus returns to whatever opened it.
export function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const element = dialog.current
    const opener = document.activeElement as HTMLElement | null
    element?.showModal()
    return () => opener?.focus()
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
      <div className="dp-sheet-body">{children}</div>
    </dialog>
  )
}
