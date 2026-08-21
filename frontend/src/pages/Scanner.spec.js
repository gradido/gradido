// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import { createI18n } from 'vue-i18n'
import Scanner from './Scanner.vue'
import de from '@/locales/de.json'
import en from '@/locales/en.json'

/**
 * The scanner page: the four views of the approved mockup, and above all the scan
 * matrix — own community navigates wordlessly, a foreign one only ever through the
 * confirmation card, anything else never at all.
 *
 * The camera is mocked (`useQrScanner`); a "scan" is the test calling the `onCode`
 * callback the page handed over. The parser runs for real — it has its own spec, and
 * mocking it here would let the page and the parser drift apart unnoticed.
 */

const state = { gradidoID: 'user-one' }
vi.mock('vuex', () => ({ useStore: () => ({ state }) }))

const historyState = { back: null }
const mockRouter = {
  back: vi.fn(),
  push: vi.fn(),
  options: { history: { state: historyState } },
}
vi.mock('vue-router', () => ({ useRouter: () => mockRouter }))

/** The page hands its onCode here; scannerState is what the page renders from. */
const scannerState = ref('scanning')
let capturedOnCode = null
const scannerMock = {
  state: scannerState,
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
}
vi.mock('@/composables/useQrScanner', () => ({
  useQrScanner: (onCode) => {
    capturedOnCode = onCode
    return scannerMock
  },
}))

/** jsdom pins location.assign as non-configurable, so the jump goes through this seam. */
const openExternalUrlMock = vi.fn()
vi.mock('@/utils/browserLocation', () => ({
  openExternalUrl: (url) => openExternalUrlMock(url),
}))

vi.mock('bootstrap-vue-next', () => ({
  BButton: {
    props: ['disabled'],
    template: '<button :disabled="disabled"><slot></slot></button>',
  },
  BFormInput: {
    props: ['modelValue'],
    template:
      '<input :value="modelValue" @input="$emit(`update:modelValue`, $event.target.value)" />',
  },
}))

/** A foreign host for the confirmation-card cases. */
const FOREIGN = 'markt-gemeinschaft.gradido.net'
/** An own-community URL, built on jsdom's real host so nothing needs window.location mocked. */
const ownUrl = (path) => `https://${window.location.host}${path}`

const mounted = []
const mountScanner = () => {
  const wrapper = mount(Scanner, {
    global: {
      plugins: [createI18n({ legacy: false, locale: 'de', messages: { de, en } })],
      stubs: ['IMdiArrowLeft', 'IMdiWeb', 'IMdiCellphone', 'IMdiKeyboardOutline'],
    },
  })
  mounted.push(wrapper)
  return wrapper
}

const el = (wrapper, name) => wrapper.find(`[data-test="scanner-${name}"]`)
const scan = async (wrapper, rawValue) => {
  capturedOnCode(rawValue)
  await wrapper.vm.$nextTick()
}

describe('Scanner page', () => {
  beforeEach(() => {
    state.gradidoID = 'user-one'
    historyState.back = null
    scannerState.value = 'scanning'
    capturedOnCode = null
    mockRouter.back.mockClear()
    mockRouter.push.mockClear()
    scannerMock.start.mockClear()
    scannerMock.stop.mockClear()
    scannerMock.pause.mockClear()
    scannerMock.resume.mockClear()
    openExternalUrlMock.mockClear()
    window.localStorage.clear()
  })

  afterEach(() => {
    while (mounted.length) {
      mounted.pop().unmount()
    }
  })

  describe('the viewfinder', () => {
    it('starts the camera into the video element on mount', () => {
      const wrapper = mountScanner()
      expect(scannerMock.start).toHaveBeenCalledWith(wrapper.find('video').element)
    })

    it('shows title, hint and the hand-entry link while scanning', () => {
      const wrapper = mountScanner()
      expect(wrapper.text()).toContain('Gradido-Code scannen')
      expect(el(wrapper, 'hint').text()).toBe(
        'Dank-Karte, Scheck oder Gradido-Karte ins Bild halten',
      )
      expect(el(wrapper, 'manual-open').text()).toBe('Code oder Link von Hand eingeben')
    })
  })

  describe('the scan matrix', () => {
    it('opens an own thank-you card wordlessly and stops the camera', async () => {
      const wrapper = mountScanner()
      await scan(wrapper, ownUrl('/dk/abc123'))

      expect(scannerMock.stop).toHaveBeenCalled()
      expect(mockRouter.push).toHaveBeenCalledWith('/dk/abc123')
      expect(el(wrapper, 'foreign').exists()).toBe(false)
    })

    it('opens an own Gradido card wordlessly', async () => {
      const wrapper = mountScanner()
      await scan(wrapper, ownUrl('/u/somebody'))
      expect(mockRouter.push).toHaveBeenCalledWith('/u/somebody')
    })

    it('holds a foreign code behind the confirmation card', async () => {
      const wrapper = mountScanner()
      await scan(wrapper, `https://${FOREIGN}/dk/abc`)

      expect(scannerMock.pause).toHaveBeenCalled()
      expect(el(wrapper, 'foreign').exists()).toBe(true)
      expect(el(wrapper, 'foreign-host').text()).toBe(FOREIGN)
      expect(wrapper.text()).toContain('Dank-Karte einer anderen Community')
      // ⛔ Nothing navigated: not internally, and the jump only ever follows the press.
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it.each([
      ['/redeem/abc', 'Scheck einer anderen Community'],
      ['/u/abc', 'Gradido-Karte einer anderen Community'],
    ])('names the foreign kind for %s', async (path, title) => {
      const wrapper = mountScanner()
      await scan(wrapper, `https://${FOREIGN}${path}`)
      expect(wrapper.text()).toContain(title)
    })

    it('jumps only on the confirming press, with the camera dead first', async () => {
      const wrapper = mountScanner()
      await scan(wrapper, `https://${FOREIGN}/dk/abc`)
      expect(openExternalUrlMock).not.toHaveBeenCalled()

      await el(wrapper, 'foreign-open').trigger('click')

      expect(scannerMock.stop).toHaveBeenCalled()
      expect(openExternalUrlMock).toHaveBeenCalledWith(`https://${FOREIGN}/dk/abc`)
    })

    it('keep-scanning closes the card, resumes, and quiets that code for the moment', async () => {
      const wrapper = mountScanner()
      const raw = `https://${FOREIGN}/dk/abc`
      await scan(wrapper, raw)
      await el(wrapper, 'foreign-continue').trigger('click')

      expect(el(wrapper, 'foreign').exists()).toBe(false)
      expect(scannerMock.resume).toHaveBeenCalled()

      // The same card still in the picture must not reopen the sheet on the next tick…
      await scan(wrapper, raw)
      expect(el(wrapper, 'foreign').exists()).toBe(false)

      // …but a DIFFERENT code is a new decision.
      await scan(wrapper, `https://${FOREIGN}/dk/other`)
      expect(el(wrapper, 'foreign').exists()).toBe(true)
    })

    it('restarts a stopped camera on keep-scanning instead of resuming a dead one', async () => {
      const wrapper = mountScanner()
      await scan(wrapper, `https://${FOREIGN}/dk/abc`)
      // While the card was open the tab went hidden: the camera was STOPPED, not paused.
      scannerState.value = 'idle'
      await el(wrapper, 'foreign-continue').trigger('click')

      expect(scannerMock.resume).not.toHaveBeenCalled()
      expect(scannerMock.start).toHaveBeenCalledTimes(2)
    })

    it('says "no Gradido code" for anything else and never opens it', async () => {
      const wrapper = mountScanner()
      await scan(wrapper, 'WIFI:T:WPA;S:cafe;P:secret;;')

      expect(el(wrapper, 'unknown').text()).toBe('Kein Gradido-Code.')
      expect(mockRouter.push).not.toHaveBeenCalled()
      expect(openExternalUrlMock).not.toHaveBeenCalled()
      expect(el(wrapper, 'foreign').exists()).toBe(false)
      expect(scannerMock.stop).not.toHaveBeenCalled()
    })
  })

  describe('hand entry', () => {
    it('opens the sheet over the running camera', async () => {
      const wrapper = mountScanner()
      await el(wrapper, 'manual-open').trigger('click')
      expect(el(wrapper, 'manual').exists()).toBe(true)
      expect(scannerMock.stop).not.toHaveBeenCalled()
    })

    it('opens an own link typed by hand', async () => {
      const wrapper = mountScanner()
      await el(wrapper, 'manual-open').trigger('click')
      await el(wrapper, 'manual-input').setValue('dk/typed123')
      await el(wrapper, 'manual-submit').trigger('submit')

      expect(scannerMock.stop).toHaveBeenCalled()
      expect(mockRouter.push).toHaveBeenCalledWith('/dk/typed123')
    })

    it('sends a typed foreign link down the same confirmation road', async () => {
      const wrapper = mountScanner()
      await el(wrapper, 'manual-open').trigger('click')
      await el(wrapper, 'manual-input').setValue(`${FOREIGN}/redeem/xyz`)
      await el(wrapper, 'manual-submit').trigger('submit')

      expect(el(wrapper, 'manual').exists()).toBe(false)
      expect(el(wrapper, 'foreign').exists()).toBe(true)
      expect(el(wrapper, 'foreign-host').text()).toBe(FOREIGN)
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('answers nonsense with the invalid line and stays open', async () => {
      const wrapper = mountScanner()
      await el(wrapper, 'manual-open').trigger('click')
      await el(wrapper, 'manual-input').setValue('not a link at all')
      await el(wrapper, 'manual-submit').trigger('submit')

      expect(el(wrapper, 'manual-invalid').exists()).toBe(true)
      expect(el(wrapper, 'manual').exists()).toBe(true)
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('closes without consequences', async () => {
      const wrapper = mountScanner()
      await el(wrapper, 'manual-open').trigger('click')
      await el(wrapper, 'manual-close').trigger('click')
      expect(el(wrapper, 'manual').exists()).toBe(false)
    })
  })

  describe('camera refused or missing', () => {
    it('shows remedy and the two old ways when denied', async () => {
      scannerState.value = 'denied'
      const wrapper = mountScanner()
      await wrapper.vm.$nextTick()

      expect(el(wrapper, 'denied').exists()).toBe(true)
      expect(wrapper.text()).toContain('Kein Zugriff auf die Kamera')
      expect(wrapper.text()).toContain('Browser-Einstellungen')
      expect(wrapper.text()).toContain('Mit der Kamera-App scannen')
      expect(el(wrapper, 'manual-input').exists()).toBe(true)
      expect(wrapper.find('video').exists()).toBe(false)
    })

    it('drops the settings sentence when there is no camera at all', async () => {
      scannerState.value = 'unavailable'
      const wrapper = mountScanner()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Keine Kamera gefunden')
      expect(wrapper.text()).not.toContain('Browser-Einstellungen')
    })

    it('promises the waiting amount only when one actually waits', async () => {
      scannerState.value = 'denied'
      const without = mountScanner()
      await without.vm.$nextTick()
      expect(el(without, 'parked-waiting').exists()).toBe(false)

      window.localStorage.setItem(
        'calculator-parked-amount:user-one',
        JSON.stringify({ amount: 6.3, at: Date.now() }),
      )
      const withParked = mountScanner()
      await withParked.vm.$nextTick()
      expect(el(withParked, 'parked-waiting').exists()).toBe(true)
    })

    it('the inline form resolves like the sheet', async () => {
      scannerState.value = 'denied'
      const wrapper = mountScanner()
      await wrapper.vm.$nextTick()
      await el(wrapper, 'manual-input').setValue(ownUrl('/redeem/byhand'))
      await el(wrapper, 'manual-submit').trigger('submit')
      expect(mockRouter.push).toHaveBeenCalledWith('/redeem/byhand')
    })
  })

  describe('leaving and coming back', () => {
    it('back stops the camera and walks the history', async () => {
      historyState.back = '/calculator'
      const wrapper = mountScanner()
      await el(wrapper, 'back').trigger('click')
      expect(scannerMock.stop).toHaveBeenCalled()
      expect(mockRouter.back).toHaveBeenCalled()
    })

    it('back from a deep link lands on the overview', async () => {
      historyState.back = null
      const wrapper = mountScanner()
      await el(wrapper, 'back').trigger('click')
      expect(mockRouter.push).toHaveBeenCalledWith('/overview')
    })

    const setVisibility = (value) => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value })
      document.dispatchEvent(new Event('visibilitychange'))
    }

    it('a hidden tab stops the camera; coming back restarts it', async () => {
      const wrapper = mountScanner()
      expect(scannerMock.start).toHaveBeenCalledTimes(1)

      setVisibility('hidden')
      expect(scannerMock.stop).toHaveBeenCalled()

      scannerState.value = 'idle'
      setVisibility('visible')
      expect(scannerMock.start).toHaveBeenCalledTimes(2)
      wrapper.unmount()
      mounted.pop()
    })

    it('unmounting stops the camera', () => {
      const wrapper = mountScanner()
      wrapper.unmount()
      mounted.pop()
      expect(scannerMock.stop).toHaveBeenCalled()
    })
  })
})
