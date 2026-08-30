// AI-GENERATED — not an architecture reference

import { markAppOutdated, useAppOutdated } from '@/composables/useAppOutdated'

/**
 * Asks the server, now and then, whether it is serving a newer build than the one this page
 * is running -- and raises the flag that AppOutdatedBar reads.
 *
 * The wallet already has two cures for a stale bundle, and both wait for damage:
 * reloadOnStaleChunk reacts to a route chunk that the deploy has removed, and useAppOutdated
 * reacts to an operation the server rejects because the schema moved. A frontend-only deploy
 * -- a text, a stylesheet, a fix inside code that is already loaded -- breaks neither, so
 * nothing signals and the old bundle keeps running.
 *
 * In a browser tab that costs little: the reload arrow is right there. Installed on a home
 * screen there is no such arrow (that is what `display: standalone` means, see the manifest),
 * and the app's process survives being swiped away for a long time -- so index.html, the one
 * file the bare-metal nginx sends as no-store, is not fetched again for days.
 *
 * ⚠️ Nothing here reloads on its own. Somebody may have half a contribution typed; the reload
 * is a button in the bar, for the same reason it is one in useAppOutdated.
 *
 * ⚠️ What this raises the bar for is "the bytes being served are not the bytes you are
 * running" -- which is wider than "something you can see has changed". Measured on the built
 * artefact: `EnvironmentPlugin` in vite.config.mjs inlines the repo's HEAD into the entry
 * chunk (`grep -o 'BUILD_COMMIT:"[0-9a-f]*"' build/assets/index-*.js`), and start.sh rebuilds
 * every package on every deploy, so a BACKEND-ONLY deploy also moves the entry hash and will
 * offer a reload that changes nothing a member can see. That is the honest reading of the
 * signal, not a flaw in it -- no mechanical comparison can decide which differences matter.
 */

// The gap collapses bursts: foregrounding the app usually delivers visibilitychange, pageshow
// and a navigation within the same second. The interval fires well past it, so a page left in
// the foreground is really checked every CHECK_INTERVAL_MS.
const CHECK_INTERVAL_MS = 15 * 60 * 1000
const CHECK_GAP_MS = 5 * 60 * 1000
// An attempt that never reached an answer (offline, or a 502 while the deploy is running) may
// be repeated sooner -- a deploy is exactly when the server is most likely to refuse, so the
// check that matters most is the one most likely to fail.
const RETRY_GAP_MS = 30 * 1000

const ASSET_PREFIX = '/assets/'

/**
 * Every hashed build artefact a document points at, as one comparable string.
 *
 * Not `querySelector` on the first module script: that would compare whatever tag happens to
 * come first, and Vite's dev server prepends `/@vite/client` to <head> while this project's
 * own entry sits at the bottom of <body>. Filtering on the asset prefix instead has three
 * consequences, all of them wanted -- the entry stylesheet is included, so a build whose only
 * change is CSS still differs; the order of the tags cannot matter, because the list is
 * sorted; and under `vite dev` nothing is served from /assets/ at all, so the result is empty
 * and the module leaves without installing anything.
 *
 * ⚠️ `getAttribute`, not the `src`/`href` property: the property is resolved to an absolute
 * URL, and the two sides are then only equal as long as the running page and the fetched copy
 * agree on the origin. The literal attribute is what both documents actually record.
 *
 * ⚠️ The prefix is Vite's default `assetsDir` under the default `base`. newVersionCheck.spec.js
 * holds it against vite.config.mjs, because a `base` or `assetsDir` set there would make this
 * silently match nothing -- and an empty result is the quiet direction: no bar, ever.
 */
const buildAssets = (root) =>
  [...root.querySelectorAll('script[src], link[href]')]
    .map((element) => element.getAttribute('src') ?? element.getAttribute('href'))
    .filter((url) => url?.startsWith(ASSET_PREFIX))
    .sort()
    .join(' ')

/**
 * @param {object} options
 * @param {import('vue-router').Router} [options.router] adds every in-app navigation as a
 *   trigger; it needs no browser event at all, so it is the one that behaves the same
 *   everywhere.
 * @param {Window} [options.win]
 * @param {Document} [options.doc]
 */
export const installNewVersionCheck = ({ router, win = window, doc = document } = {}) => {
  // Read once, before anything can navigate. From here on this is what "the version we are
  // running" means, and it stays true until the page really is reloaded.
  const running = buildAssets(doc)
  if (!running) return

  const { appOutdated } = useAppOutdated()

  /**
   * ⛔ Seeded, NOT zero. Two of the four triggers below fire during the ordinary boot of the
   * page that just registered them: `pageshow` fires on every load, not only on a restore
   * from the page cache, and main.js installs this before `app.use(router)`, so vue-router's
   * initial navigation runs the afterEach hook as well. With a zero stamp both get past the
   * gap, and every cold start would spend a no-store request whose answer is known -- the
   * browser fetched that same index.html a second earlier -- and would then hold the gap
   * shut for the first five minutes the app is open.
   */
  let lastCheckedAt = Date.now()
  let gapMs = CHECK_GAP_MS

  const check = async () => {
    // The shared flag, not a private copy: apolloProvider raises it too, on a schema
    // mismatch. Once the bar is up there is nothing left to learn, whoever put it there.
    if (appOutdated.value) return

    /**
     * ⚠️ Both directions, as reloadOnStaleChunk guards its own stamp: one that lies AHEAD of
     * the clock (a clock put back) would make the difference negative -- under the gap
     * forever, and this page would never ask again.
     */
    const now = Date.now()
    if (lastCheckedAt <= now && now - lastCheckedAt < gapMs) return
    // Stamped before the request, not after: two triggers in the same tick would otherwise
    // both get past the gap and fetch. Until an answer arrives, the short gap applies.
    lastCheckedAt = now
    gapMs = RETRY_GAP_MS

    let html
    try {
      const response = await win.fetch('/index.html', { cache: 'no-store' })
      // ⛔ `redirected` as well as `ok`: a captive portal answers 200 for everything, and its
      // own page may well carry a /assets/ bundle of its own. The bar cannot be dismissed, so
      // a wrong raise costs more than a missed one.
      if (response.redirected || !response.ok) return
      html = await response.text()
    } catch {
      // Offline, or the server is down. Neither says anything about the version.
      return
    }
    // An answer arrived, whatever it says.
    gapMs = CHECK_GAP_MS

    const served = buildAssets(new DOMParser().parseFromString(html, 'text/html'))
    // Nothing from /assets/ means we are not looking at our own index.html. `served ===
    // running` is the ordinary answer: nothing was deployed.
    if (!served || served === running) return

    markAppOutdated()
  }

  /**
   * Four triggers into one throttled check, because which of them fires is a property of the
   * device and not something this code can know: visibilitychange had its trouble in exactly
   * this standalone mode before iOS 13, and Safari has never had the Chromium lifecycle
   * events at all. The check is idempotent and gap-guarded, so a redundant trigger costs
   * nothing -- and only one of them has to work.
   *
   * ⚠️ The interval bounds how stale a page that is merely LEFT OPEN can get; it does not
   * bound the home-screen case this module was written for, because a suspended process runs
   * no timers. There the bound is the first of the other three that fires on resume -- and
   * the navigation hook is the one that needs no browser event, which is why the router is
   * handed in rather than left out.
   */
  doc.addEventListener('visibilitychange', () => {
    if (doc.visibilityState === 'visible') return check()
  })
  win.addEventListener('pageshow', () => check())
  win.setInterval(() => check(), CHECK_INTERVAL_MS)
  router?.afterEach(() => check())
}
