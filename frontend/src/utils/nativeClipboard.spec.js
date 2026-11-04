// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The module takes hold of the browser's clipboard when it is loaded, so each test loads it anew.
const load = () => {
  vi.resetModules()
  return import('./nativeClipboard')
}

describe('nativeClipboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    delete window.navigator.clipboard
  })

  describe('in a browser without the clipboard for pictures', () => {
    it('says no', async () => {
      const { takesPictureInClipboard } = await load()
      expect(takesPictureInClipboard()).toBe(false)
    })

    // Old Firefox has the clipboard for text only.
    it('says no where there is a clipboard, but no ClipboardItem', async () => {
      Object.defineProperty(window.navigator, 'clipboard', {
        value: { write: vi.fn() },
        configurable: true,
      })
      const { takesPictureInClipboard } = await load()
      expect(takesPictureInClipboard()).toBe(false)
    })

    it('says no where there is a ClipboardItem, but no write', async () => {
      vi.stubGlobal('ClipboardItem', class {})
      Object.defineProperty(window.navigator, 'clipboard', { value: {}, configurable: true })
      const { takesPictureInClipboard } = await load()
      expect(takesPictureInClipboard()).toBe(false)
    })
  })

  describe('in a browser with it', () => {
    const write = vi.fn()
    let browserClipboard
    class BrowserClipboardItem {
      constructor(items) {
        this.items = items
      }
    }

    beforeEach(() => {
      write.mockReset().mockResolvedValue(undefined)
      browserClipboard = { write }
      vi.stubGlobal('ClipboardItem', BrowserClipboardItem)
      Object.defineProperty(window.navigator, 'clipboard', {
        value: browserClipboard,
        configurable: true,
      })
    })

    it('says yes', async () => {
      const { takesPictureInClipboard } = await load()
      expect(takesPictureInClipboard()).toBe(true)
    })

    it('hands the browser a PNG, as the clipboard wants to be asked', async () => {
      const { writePictureToClipboard } = await load()
      const png = new Blob(['png'], { type: 'image/png' })

      await writePictureToClipboard(png)

      expect(write.mock.contexts[0]).toBe(browserClipboard)
      const [[item]] = write.mock.calls[0]
      expect(item).toBeInstanceOf(BrowserClipboardItem)
      expect(item.items).toEqual({ 'image/png': png })
    })

    // ⛔ What it is all for. The polyfill runs here as it runs in main.js, and replaces both. A picture
    // that is still being made must reach the BROWSER's write at once: Safari refuses it after the tap.
    it('goes past the polyfill, and within the tap, with a picture still being made', async () => {
      const { takesPictureInClipboard, writePictureToClipboard } = await load()
      await import('clipboard-polyfill/overwrite-globals')
      expect(navigator.clipboard.write).not.toBe(write)
      expect(window.ClipboardItem).not.toBe(BrowserClipboardItem)

      const stillBeingMade = new Promise(() => {})
      writePictureToClipboard(stillBeingMade)

      expect(takesPictureInClipboard()).toBe(true)
      expect(write).toHaveBeenCalledTimes(1)
      const [[item]] = write.mock.calls[0]
      expect(item).toBeInstanceOf(BrowserClipboardItem)
      expect(item.items['image/png']).toBe(stillBeingMade)
    })

    it('hands on the refusal of the browser', async () => {
      const refusal = new DOMException('no', 'NotAllowedError')
      write.mockRejectedValue(refusal)
      const { writePictureToClipboard } = await load()
      await expect(writePictureToClipboard(new Blob())).rejects.toBe(refusal)
    })
  })

  // ⛔ Below the polyfill this module would take hold of the polyfill's own `write`, and nothing else
  // would notice: a browser without the real thing would be promised a picture, and in the rest the
  // write would come after the tap.
  it('is loaded above the polyfill', () => {
    const main = readFileSync(resolve(__dirname, '../main.js'), 'utf8')
    const here = main.indexOf("import './utils/nativeClipboard'")
    const polyfill = main.indexOf("import 'clipboard-polyfill/overwrite-globals'")
    expect(here).toBeGreaterThan(-1)
    expect(polyfill).toBeGreaterThan(here)
  })
})
