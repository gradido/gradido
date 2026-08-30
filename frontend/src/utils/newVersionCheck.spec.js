// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { installNewVersionCheck } from './newVersionCheck'
import { markAppOutdated, resetAppOutdated, useAppOutdated } from '@/composables/useAppOutdated'

const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

const RUNNING = ['/assets/index-KFngvIkd.js', '/assets/index-wFomHqQY.css']
const DEPLOYED = ['/assets/index-CsYm46n6.js', '/assets/index-Bq7xTn2p.css']

/**
 * Shaped like what the server really sends (checked against build/index.html): Vite hoists the
 * module script into <head> with `crossorigin`, so `src` is not the first attribute; the entry
 * stylesheet is a SEPARATE tag; and two absolute font stylesheets sit alongside them, which
 * the check has to ignore. Anything that read the tags positionally, or that counted every
 * <link>, would pass against a hand-tidied fixture and fail against the real file.
 */
const page = (assets) =>
  '<!DOCTYPE html><html><head>' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Open+Sans">' +
  assets
    .map((url) =>
      url.endsWith('.css')
        ? `<link rel="stylesheet" crossorigin href="${url}">`
        : `<script type="module" crossorigin src="${url}"></scr` + 'ipt>',
    )
    .join('') +
  '</head><body><div id="app"></div></body></html>'

// What `vite dev` really serves: its client injected head-prepend, this project's own entry at
// the bottom of <body>, and nothing under /assets/ at all.
const devPage = () =>
  '<!DOCTYPE html><html><head><script type="module" src="/@vite/client"></scr' +
  'ipt></head><body><div id="app"></div><script type="module" src="/src/main.js"></scr' +
  'ipt></body></html>'

const setup = ({ running = page(RUNNING), served = page(RUNNING) } = {}) => {
  const docListeners = {}
  const winListeners = {}
  const intervals = []
  const navigations = []

  // A real Document behind querySelectorAll, so the asset collection is exercised against real
  // markup on the running side too -- not only on the served side, where DOMParser does it.
  const parsed = new DOMParser().parseFromString(running, 'text/html')
  const doc = {
    visibilityState: 'visible',
    querySelectorAll: (selector) => parsed.querySelectorAll(selector),
    addEventListener: (name, handler) => {
      docListeners[name] = handler
    },
  }

  const answer = { served, ok: true, redirected: false, fails: false }
  const fetch = vi.fn(async () => {
    if (answer.fails) throw new Error('offline')
    return { ok: answer.ok, redirected: answer.redirected, text: async () => answer.served }
  })

  const win = {
    fetch,
    addEventListener: (name, handler) => {
      winListeners[name] = handler
    },
    setInterval: (handler, ms) => intervals.push({ handler, ms }),
  }
  const router = { afterEach: (handler) => navigations.push(handler) }

  return {
    answer,
    fetch,
    doc,
    intervals,
    install: (extra = {}) => installNewVersionCheck({ router, win, doc, ...extra }),
    visibilityChange: () => docListeners.visibilitychange?.(),
    pageShow: () => winListeners.pageshow?.(),
    interval: () => intervals[0]?.handler(),
    navigate: () => navigations[0]?.(),
    outdated: () => useAppOutdated().appOutdated.value,
  }
}

// Past the gap, so a trigger fired after this is a real check rather than a suppressed one.
const waitOutTheGap = () => vi.advanceTimersByTime(5 * 60 * 1000 + 1)

describe('installNewVersionCheck', () => {
  beforeEach(() => {
    resetAppOutdated()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('what it compares', () => {
    it('raises the flag when the server is serving a different build', async () => {
      const app = setup({ served: page(DEPLOYED) })
      app.install()
      waitOutTheGap()
      await app.interval()

      expect(app.outdated()).toBe(true)
    })

    it('stays quiet while the served build is the one we are running', async () => {
      const app = setup()
      app.install()
      waitOutTheGap()
      await app.interval()

      expect(app.outdated()).toBe(false)
    })

    // The entry stylesheet is its own tag, so a build whose only change is CSS moves nothing
    // in the module script's name. Reading only the script would miss it.
    it('notices a build whose only change is the stylesheet', async () => {
      const app = setup({ served: page([RUNNING[0], '/assets/index-Bq7xTn2p.css']) })
      app.install()
      waitOutTheGap()
      await app.interval()

      expect(app.outdated()).toBe(true)
    })

    // The same assets in the other tag order are the same build. Without sorting, a reordering
    // by any tool in the chain would read as a deploy on every single check.
    it('is not fooled by the tags arriving in a different order', async () => {
      const app = setup({ served: page([...RUNNING].reverse()) })
      app.install()
      waitOutTheGap()
      await app.interval()

      expect(app.outdated()).toBe(false)
    })

    // Without no-store the browser may answer from its own cache, and the check would then
    // compare the running build against itself for as long as that entry lives.
    it('asks for index.html and forbids the browser cache', async () => {
      const app = setup()
      app.install()
      waitOutTheGap()
      await app.interval()

      expect(app.fetch).toHaveBeenCalledWith('/index.html', { cache: 'no-store' })
    })
  })

  describe('when the answer says nothing about the version', () => {
    it.each([
      ['the request fails', (answer) => (answer.fails = true)],
      ['the response is not ok', (answer) => (answer.ok = false)],
      // ⛔ A captive portal answers 200 for everything, and its own page may well carry a
      // /assets/ bundle of its own. The bar cannot be dismissed, so a wrong raise costs more
      // than a missed one.
      ['the request was redirected', (answer) => (answer.redirected = true)],
      ['the answer carries nothing from /assets/', (answer) => (answer.served = devPage())],
    ])('stays quiet when %s', async (_name, breakIt) => {
      const app = setup({ served: page(DEPLOYED) })
      breakIt(app.answer)
      app.install()
      waitOutTheGap()
      await app.interval()

      expect(app.outdated()).toBe(false)
    })

    // Under `vite dev` the client is injected head-prepend and the entry sits in <body>, and
    // neither is under /assets/ -- so there is nothing to compare and the module leaves.
    it('does not install itself at all under vite dev', () => {
      const app = setup({ running: devPage() })
      app.install()

      expect(app.intervals).toHaveLength(0)
      expect(app.fetch).not.toHaveBeenCalled()
    })
  })

  describe('every trigger reaches the check', () => {
    it.each([
      ['a navigation inside the app', (app) => app.navigate()],
      ['the app coming to the foreground', (app) => app.visibilityChange()],
      ['a restore from the page cache', (app) => app.pageShow()],
      ['the interval', (app) => app.interval()],
    ])('%s raises the flag', async (_name, fire) => {
      const app = setup({ served: page(DEPLOYED) })
      app.install()
      waitOutTheGap()
      await fire(app)

      expect(app.outdated()).toBe(true)
    })

    // The interval bounds how stale a page that is merely left open can get.
    it('polls every fifteen minutes', () => {
      const app = setup()
      app.install()

      expect(app.intervals).toEqual([{ handler: expect.any(Function), ms: 15 * 60 * 1000 }])
    })

    it('leaves the router out when there is none, and still installs the rest', async () => {
      const app = setup({ served: page(DEPLOYED) })
      app.install({ router: undefined })
      waitOutTheGap()
      await app.interval()

      expect(app.outdated()).toBe(true)
    })

    it('does not ask while the app is going into the background', async () => {
      const app = setup({ served: page(DEPLOYED) })
      app.install()
      waitOutTheGap()
      app.doc.visibilityState = 'hidden'
      await app.visibilityChange()

      expect(app.fetch).not.toHaveBeenCalled()
    })
  })

  describe('how often it asks', () => {
    /**
     * ⛔ The boot case, and it is the reason the stamp is seeded rather than zero. `pageshow`
     * fires on every load, not only on a restore, and main.js registers the router hook before
     * `app.use(router)`, so vue-router's initial navigation runs it too. Both arrive on the
     * page that just registered them, and the answer is known: the browser fetched that same
     * index.html a second earlier.
     */
    it.each([
      ['the load-time pageshow', (app) => app.pageShow()],
      ['the initial navigation', (app) => app.navigate()],
      ['a foregrounding right after boot', (app) => app.visibilityChange()],
    ])('does not ask on %s', async (_name, fire) => {
      const app = setup({ served: page(DEPLOYED) })
      app.install()
      await fire(app)

      expect(app.fetch).not.toHaveBeenCalled()
    })

    // Foregrounding the app usually delivers visibilitychange, pageshow and a navigation
    // within the same second. That is one question, not three.
    it('asks once when several triggers arrive together', async () => {
      const app = setup()
      app.install()
      waitOutTheGap()
      await app.visibilityChange()
      await app.pageShow()
      await app.navigate()

      expect(app.fetch).toHaveBeenCalledTimes(1)
    })

    it('is willing again once the gap has passed', async () => {
      const app = setup()
      app.install()
      waitOutTheGap()
      await app.visibilityChange()
      waitOutTheGap()
      await app.visibilityChange()

      expect(app.fetch).toHaveBeenCalledTimes(2)
    })

    /**
     * A deploy is exactly when the server is most likely to refuse, so the check that matters
     * most is the one most likely to fail. An attempt that never reached an answer must not
     * cost the same five minutes of silence as one that did.
     */
    it('retries sooner after an attempt that reached no answer', async () => {
      const app = setup()
      app.answer.fails = true
      app.install()
      waitOutTheGap()
      await app.visibilityChange()
      vi.advanceTimersByTime(31 * 1000)
      await app.visibilityChange()

      expect(app.fetch).toHaveBeenCalledTimes(2)
    })

    it('waits the full gap after an attempt that did reach one', async () => {
      const app = setup()
      app.install()
      waitOutTheGap()
      await app.visibilityChange()
      vi.advanceTimersByTime(31 * 1000)
      await app.visibilityChange()

      expect(app.fetch).toHaveBeenCalledTimes(1)
    })

    /**
     * ⚠️ A stamp ahead of the clock -- a clock put back -- would make the difference negative
     * and hold it under the gap for the life of the page. Same guard as reloadOnStaleChunk.
     */
    it('keeps asking after the clock has been put back', async () => {
      const app = setup()
      app.install()
      waitOutTheGap()
      await app.visibilityChange()
      vi.setSystemTime(new Date(Date.now() - 2 * 60 * 60 * 1000))
      await app.visibilityChange()

      expect(app.fetch).toHaveBeenCalledTimes(2)
    })

    it('stops asking once it has raised the flag itself', async () => {
      const app = setup({ served: page(DEPLOYED) })
      app.install()
      waitOutTheGap()
      await app.visibilityChange()
      vi.advanceTimersByTime(60 * 60 * 1000)
      await app.visibilityChange()

      expect(app.fetch).toHaveBeenCalledTimes(1)
    })

    /**
     * ⛔ And once SOMEBODY ELSE has raised it. apolloProvider raises the same flag on a schema
     * mismatch, and on a full-stack deploy it usually gets there first. A private copy of the
     * flag would keep this module fetching for the life of the page -- days, on a home-screen
     * install -- to decide whether to raise a bar that is already on screen.
     */
    it('stops asking once apollo has raised the flag', async () => {
      const app = setup()
      app.install()
      markAppOutdated()
      waitOutTheGap()
      await app.visibilityChange()

      expect(app.fetch).not.toHaveBeenCalled()
    })
  })
})

/**
 * The two things nothing else would notice, held against the files that state them -- the way
 * webAppManifest.spec.js holds the manifest against index.html and the nginx templates.
 */
describe('what the module rests on', () => {
  /**
   * ⛔ Comments come out first, and that is the whole reason this helper exists. Measured: with
   * a plain substring match, commenting the call out in main.js left all tests green -- the
   * text was still in the file. A call parked during a debugging session and left that way is
   * exactly what this guard is here to catch.
   *
   * ⚠️ Whole-line `//` only, not trailing ones: main.js carries a `https://` inside a string,
   * and a stripper that ate everything after a double slash would mangle it. A call hidden in a
   * trailing comment would still slip through; a whole-line one and a block cannot.
   */
  const live = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')

  const mainJs = live(read('../main.js'))

  it('is called from main.js', () => {
    expect(mainJs).toContain("import { installNewVersionCheck } from './utils/newVersionCheck'")
    expect(mainJs).toMatch(/^[ \t]*installNewVersionCheck\(/m)
  })

  // Without the router the check still runs, but it loses the one trigger that needs no
  // browser event -- exactly the trigger that carries the devices whose events misbehave.
  it('is handed the router', () => {
    expect(mainJs).toMatch(/^[ \t]*installNewVersionCheck\(\{\s*router\s*\}\)/m)
  })

  /**
   * ⛔ The check finds the build by the /assets/ prefix, which is Vite's default `assetsDir`
   * under the default `base`. Set either in vite.config.mjs and the prefix matches nothing --
   * `running` comes out empty, the module quietly declines to install, and no test anywhere
   * fails. So the assumption is held against the file that would break it.
   */
  it('may assume the default asset prefix, because vite.config.mjs sets neither base nor assetsDir', () => {
    const viteConfig = live(read('../../vite.config.mjs'))

    expect(viteConfig).not.toMatch(/\bbase\s*:/)
    expect(viteConfig).not.toMatch(/\bassetsDir\s*:/)
  })
})
