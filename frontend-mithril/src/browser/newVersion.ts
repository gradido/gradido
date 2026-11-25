// AI-GENERATED — not an architecture reference
import m from 'mithril'
import { appOutdated } from '@/store/appOutdated'
import { repeatWhileVisible } from './timer'

// A deploy while the wallet is open leaves it running the bundle it started with. Two cures:
// a page whose chunk the deploy removed is loaded anew, and the server is asked now and then
// whether it serves another build, which raises the bar that offers the reload.

const RELOADED_AT_KEY = 'stale-chunk-reloaded-at'

/**
 * Loads the wallet anew where a page's chunk is gone from the server: index.html is never
 * cached, so the reload brings the names of the new chunks. Once a minute at most -- a chunk
 * that is missing for another reason must not reload for ever.
 */
export function reloadOnStaleChunk() {
  window.addEventListener('vite:preloadError', (event) => {
    const now = Date.now()
    try {
      const reloadedAt = Number(sessionStorage.getItem(RELOADED_AT_KEY)) || 0
      if (Math.abs(now - reloadedAt) < 60_000) {
        return
      }
      sessionStorage.setItem(RELOADED_AT_KEY, String(now))
    } catch {
      // no stamp can be kept: without it nothing would stop the next reload
      return
    }
    // the error is answered here, it need not reach the console
    event.preventDefault()
    location.reload()
  })
}

/** Every build file a page names (Vite's `/assets/`, with the hash in its name), sorted. */
function buildFilesOf(html: string) {
  return [...html.matchAll(/\s(?:src|href)=["']?(\/assets\/[^"'\s>]+)/g)]
    .map((match) => match[1])
    .sort()
    .join(' ')
}

/**
 * Asks the server for index.html every quarter of an hour while the tab is seen, and when it
 * is seen again, and raises `appOutdated` where that page names other build files than this
 * one did when it started. Nothing is reloaded here: whoever is in the middle of a text
 * decides when (the button of `AppOutdatedBar`).
 */
export function watchForNewVersion() {
  const running = buildFilesOf(document.documentElement.outerHTML)
  // under `vite dev` nothing comes from /assets/: nothing to compare
  if (!running) {
    return
  }
  // The page was fetched a moment ago: the first question waits. After an answer five minutes
  // pass before the next; after none (offline, a 502 during the deploy) half a minute.
  let askedAt = Date.now()
  let gap = 5 * 60_000
  repeatWhileVisible(15 * 60_000, async () => {
    const now = Date.now()
    // the distance, not the difference: a clock put back must not silence the check
    if (appOutdated.value || Math.abs(now - askedAt) < gap) {
      return
    }
    askedAt = now
    gap = 30_000
    const response = await fetch('/index.html', { cache: 'no-store' }).catch(() => undefined)
    // a captive portal answers every address with its own page
    if (!response?.ok || response.redirected) {
      return
    }
    gap = 5 * 60_000
    const served = buildFilesOf(await response.text())
    // none: not the wallet's page
    if (served && served !== running) {
      appOutdated.value = true
      // TODO: check if this call is really necessary and mithril not already update on variable change
      m.redraw()
    }
  })
}
