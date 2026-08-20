// AI-GENERATED — not an architecture reference

/**
 * Reloads the wallet once when a lazily loaded page fails to arrive.
 *
 * Every route is fetched on first visit, under a file name that carries a content stamp. A
 * deploy changes the stamps and removes the old files -- so a wallet that is already open
 * (an iPhone waking a frozen tab is the everyday case) asks for files that no longer exist,
 * and every navigation fails with "component could not be loaded" until somebody reloads by
 * hand. Vite reports exactly this as `vite:preloadError`; one reload fetches the fresh app.
 *
 * ⚠️ At most one automatic reload per minute. If reloading does not cure it -- the server
 * itself is down, say -- an unguarded handler would reload in a loop, and the wallet would
 * flicker forever instead of failing visibly.
 *
 * ⛔ And when the marker cannot be written, there is no reload at all. Without the marker
 * the once-a-minute guard cannot hold, and a silent reload loop is worse than the error it
 * hides -- the error at least says what is wrong.
 */
const RELOADED_AT_KEY = 'stale-chunk-reloaded-at'
const RETRY_GAP_MS = 60 * 1000

export const installStaleChunkReload = (win = window) => {
  win.addEventListener('vite:preloadError', (event) => {
    let last = 0
    try {
      last = Number(win.sessionStorage.getItem(RELOADED_AT_KEY)) || 0
    } catch {
      last = 0
    }
    /**
     * ⚠️ Both directions, same clock class as the parked amount's expiry: a marker that
     * lies AHEAD of the clock (a clock put back, or a hand-written Infinity) would make the
     * difference negative -- under the gap forever, and the cure would never run again for
     * the life of the tab.
     */
    const now = Date.now()
    if (Number.isFinite(last) && last <= now && now - last < RETRY_GAP_MS) {
      return
    }
    try {
      win.sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()))
    } catch {
      return
    }
    // Handled here, so the failed import does not surface as an error on top of the reload.
    event.preventDefault()
    win.location.reload()
  })
}
