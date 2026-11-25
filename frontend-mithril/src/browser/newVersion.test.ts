// AI-GENERATED — not an architecture reference
import { beforeEach, describe, expect, it, mock, setSystemTime } from 'bun:test'
import { location } from '../../test/browserStub'

const page = (script: string) =>
  `<html><head><link rel="stylesheet" href="/assets/index-AAA.css"></head><body><script type="module" src="/assets/${script}"></script></body></html>`

// the tab: seen, and running the build of `index-OLD.js`
const tab = Object.assign(new EventTarget(), {
  hidden: false,
  documentElement: { outerHTML: page('index-OLD.js') },
})
globalThis.document = tab as unknown as Document
const fetched = mock(
  async (): Promise<object> => ({ ok: true, text: async () => page('index-OLD.js') }),
)
globalThis.fetch = fetched as unknown as typeof fetch

const { appOutdated } = await import('@/store/appOutdated')
const { reloadOnStaleChunk, watchForNewVersion } = await import('./newVersion')

const NOW = 1760000000000
/** The tab is seen again `minutes` later, and the answer is read. */
const seenAfter = async (minutes: number) => {
  setSystemTime(new Date(Date.now() + minutes * 60_000))
  tab.dispatchEvent(new Event('visibilitychange'))
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('watchForNewVersion', () => {
  setSystemTime(new Date(NOW))
  watchForNewVersion()

  beforeEach(() => {
    fetched.mockClear()
  })

  it('does not ask for the page it was just loaded from', async () => {
    await seenAfter(1)
    expect(fetched).not.toHaveBeenCalled()
  })

  it('asks five minutes later, and says nothing where the build is the same', async () => {
    await seenAfter(5)
    expect(fetched).toHaveBeenCalledWith('/index.html', { cache: 'no-store' })
    expect(appOutdated.value).toBe(false)
  })

  it('leaves five minutes between two answers', async () => {
    await seenAfter(4)
    expect(fetched).not.toHaveBeenCalled()
  })

  it('asks again after half a minute where no answer came, or not the wallet’s', async () => {
    fetched.mockRejectedValueOnce(new Error('offline'))
    await seenAfter(2)
    expect(fetched).toHaveBeenCalledTimes(1)
    fetched.mockResolvedValueOnce({
      ok: true,
      redirected: true,
      text: async () => page('portal.js'),
    })
    await seenAfter(0.5)
    fetched.mockResolvedValueOnce({ ok: false, text: async () => page('index-NEW.js') })
    await seenAfter(0.5)
    fetched.mockResolvedValueOnce({ ok: true, text: async () => '<html>no build files</html>' })
    await seenAfter(0.5)
    expect(fetched).toHaveBeenCalledTimes(4)
    expect(appOutdated.value).toBe(false)
  })

  it('asks again after half a minute where the page could not be read', async () => {
    fetched.mockResolvedValueOnce({
      ok: true,
      text: async () => {
        throw new Error('connection lost')
      },
    })
    // half a minute after the page that was not the wallet's
    await seenAfter(0.5)
    expect(fetched).toHaveBeenCalledTimes(1)
    await seenAfter(0.5)
    expect(fetched).toHaveBeenCalledTimes(2)
    expect(appOutdated.value).toBe(false)
  })

  it('raises the bar where the server names another build, and asks no more', async () => {
    fetched.mockResolvedValueOnce({ ok: true, text: async () => page('index-NEW.js') })
    await seenAfter(5)
    expect(appOutdated.value).toBe(true)
    fetched.mockClear()
    await seenAfter(20)
    expect(fetched).not.toHaveBeenCalled()
  })
})

describe('reloadOnStaleChunk', () => {
  reloadOnStaleChunk()
  const chunkMissing = () => {
    const event = new Event('vite:preloadError', { cancelable: true })
    window.dispatchEvent(event)
    return event.defaultPrevented
  }

  it('loads the wallet anew, once a minute at most', () => {
    location.reload.mockClear()
    expect(chunkMissing()).toBe(true)
    expect(location.reload).toHaveBeenCalledTimes(1)
    expect(chunkMissing()).toBe(false)
    expect(location.reload).toHaveBeenCalledTimes(1)
    setSystemTime(new Date(Date.now() + 61_000))
    expect(chunkMissing()).toBe(true)
    expect(location.reload).toHaveBeenCalledTimes(2)
  })
})
