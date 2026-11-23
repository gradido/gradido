// AI-GENERATED — not an architecture reference
/**
 * Place for generic timer functions
 */

/**
 * Calls `fn` every `ms` milliseconds while the tab (Browser-Tab with the Frontend on Consumer-Side) is seen,
 * and once at the moment it is seen again. Returns its stop, for `onremove`.
 */
export function repeatWhileVisible(ms: number, fn: () => void) {
  let timer: ReturnType<typeof setInterval> | undefined
  const start = () => {
    clearInterval(timer)
    timer = document.hidden ? undefined : setInterval(fn, ms)
  }
  const seen = () => {
    start()
    if (!document.hidden) {
      fn()
    }
  }
  document.addEventListener('visibilitychange', seen)
  start()
  return () => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', seen)
  }
}

// TODO: add repeatWhileInvisible for slower updates in inactive tabs, so new messages can be showed in tab name
