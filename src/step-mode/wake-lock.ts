import { useEffect } from 'react'

// Keeps the screen on while mounted, through the Screen Wake Lock API. The
// browser drops the lock whenever the page is hidden, so it is asked for
// again each time the page comes back. Without the API, or if the browser
// says no, nothing happens and the screen sleeps as usual.
export function useWakeLock() {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let stopped = false

    const request = async () => {
      if (document.visibilityState !== 'visible' || (lock && !lock.released)) return
      try {
        const next = await navigator.wakeLock.request('screen')
        if (stopped) void next.release()
        else lock = next
      } catch {
        // Refused (low battery, no permission): carry on without it.
      }
    }

    void request()
    document.addEventListener('visibilitychange', request)
    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', request)
      void lock?.release()
    }
  }, [])
}
