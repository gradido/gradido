// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { walletStore } from '@test/walletStore'
import { useWalletStore } from '@/store/useWalletStore'
import {
  readChatWindowLarge,
  rememberChatWindowLarge,
  useChatWindowSize,
} from './useChatWindowSize'

const KEY = (gradidoID) => `chat-window-large:${gradidoID}`

/**
 * A component, because the composable reads the wallet store and watches it -- as a chat window
 * does. Each one stands for one chat window of the page.
 */
const mountWindow = (store) => {
  let api
  const wrapper = mount(
    {
      template: '<div>{{ large ? "large" : "usual" }}</div>',
      setup() {
        api = useChatWindowSize()
        return api
      },
    },
    { global: { plugins: [store] } },
  )
  return { wrapper, api: () => api }
}

const storeOf = (gradidoID) => walletStore({ gradidoID })

describe('useChatWindowSize', () => {
  let made

  const openWindow = (store) => {
    const one = mountWindow(store)
    made.push(one.wrapper)
    return one
  }

  beforeEach(() => {
    window.localStorage.clear()
    made = []
  })

  afterEach(() => {
    for (const wrapper of made) wrapper.unmount()
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('is the usual window while nothing is remembered', () => {
    const { wrapper } = openWindow(storeOf('member-1'))
    expect(wrapper.text()).toBe('usual')
  })

  it('is the large one where the member left it large on this device', () => {
    window.localStorage.setItem(KEY('member-1'), '1')
    const { wrapper } = openWindow(storeOf('member-1'))
    expect(wrapper.text()).toBe('large')
  })

  it('turns with the switch, and the device remembers it under the member', async () => {
    const { wrapper, api } = openWindow(storeOf('member-1'))

    api().toggleLarge()
    await nextTick()
    expect(wrapper.text()).toBe('large')
    expect(window.localStorage.getItem(KEY('member-1'))).toBe('1')
    expect(Object.keys(window.localStorage)).toEqual([KEY('member-1')])
  })

  // Back to the usual window: the key goes, so a device holds nothing for a member who has the
  // window as everybody has it.
  it('turns back, and nothing is left on the device', async () => {
    window.localStorage.setItem(KEY('member-1'), '1')
    const { wrapper, api } = openWindow(storeOf('member-1'))

    api().toggleLarge()
    await nextTick()
    expect(wrapper.text()).toBe('usual')
    expect(Object.keys(window.localStorage)).toEqual([])
  })

  /**
   * One answer for every chat window of the page: a group's window under a contact's follows the
   * switch pressed in the one over it, and a window opened from another list stands as the last
   * one was left.
   */
  it('turns every chat window of the page with one switch', async () => {
    const store = storeOf('member-1')
    const under = openWindow(store)
    const over = openWindow(store)

    over.api().toggleLarge()
    await nextTick()
    expect(over.wrapper.text()).toBe('large')
    expect(under.wrapper.text()).toBe('large')

    under.api().toggleLarge()
    await nextTick()
    expect(over.wrapper.text()).toBe('usual')
    expect(under.wrapper.text()).toBe('usual')
  })

  // ⛔ One browser serves several members (Bernd, 10.09.2026): each has their own window.
  it("does not hand the next member the previous one's window", async () => {
    const first = openWindow(storeOf('member-1'))
    first.api().toggleLarge()
    await nextTick()
    first.wrapper.unmount()

    const second = openWindow(storeOf('member-2'))
    expect(second.wrapper.text()).toBe('usual')
    expect(window.localStorage.getItem(KEY('member-2'))).toBeNull()
    // …and the first one's is still theirs.
    expect(window.localStorage.getItem(KEY('member-1'))).toBe('1')
  })

  // Signing out and in does not reload the page: the window is read anew for whoever is named.
  it('reads the window anew when another member is signed in', async () => {
    window.localStorage.setItem(KEY('member-2'), '1')
    const store = storeOf('member-1')
    const { wrapper } = openWindow(store)
    expect(wrapper.text()).toBe('usual')

    useWalletStore(store).setGradidoID('member-2')
    await nextTick()
    expect(wrapper.text()).toBe('large')

    useWalletStore(store).setGradidoID('member-1')
    await nextTick()
    expect(wrapper.text()).toBe('usual')
  })

  // The window stood open while the member changed: the switch is theirs who is named at the press.
  it('remembers the switch for whoever is named when it is pressed', async () => {
    const store = storeOf('member-1')
    const { api } = openWindow(store)
    useWalletStore(store).setGradidoID('member-2')
    await nextTick()

    api().toggleLarge()
    expect(Object.keys(window.localStorage)).toEqual([KEY('member-2')])
  })

  /**
   * ⛔ Signing out empties the store while the chat window is still on screen: the page leaves
   * only once the cache is cleared and the sign-in page has loaded. "Nobody remembered anything"
   * read as "the usual window" made a large window jump to the narrow one on its way out (the
   * second reader, 12.10.2026).
   */
  it('leaves the windows as they stand when the member signs out', async () => {
    window.localStorage.setItem(KEY('member-1'), '1')
    const store = storeOf('member-1')
    const { wrapper } = openWindow(store)
    expect(wrapper.text()).toBe('large')

    useWalletStore(store).setGradidoID(null)
    await nextTick()
    expect(wrapper.text()).toBe('large')
    // …and nothing was written for it: what the member left is still theirs.
    expect(Object.keys(window.localStorage)).toEqual([KEY('member-1')])
  })

  // The page was not reloaded in between, and the window the first one left is still in its memory.
  it('reads for the next member who signs in after that', async () => {
    window.localStorage.setItem(KEY('member-1'), '1')
    const store = storeOf('member-1')
    const first = openWindow(store)
    useWalletStore(store).setGradidoID(null)
    await nextTick()
    first.wrapper.unmount()

    useWalletStore(store).setGradidoID('member-2')
    const second = openWindow(store)
    expect(second.wrapper.text()).toBe('usual')
  })

  /**
   * ⛔ No shared key without the id (before the login answer, after signing out): the next person
   * on this browser would find it. The switch still turns the window as it stands.
   */
  it('writes nothing while nobody is named, and still turns the window', async () => {
    // The page's windows stand as the last member's did: the usual one here.
    openWindow(storeOf('member-1'))
    const { wrapper, api } = openWindow(storeOf(null))
    expect(wrapper.text()).toBe('usual')

    api().toggleLarge()
    await nextTick()
    expect(wrapper.text()).toBe('large')
    expect(Object.keys(window.localStorage)).toEqual([])

    api().toggleLarge()
    await nextTick()
    expect(wrapper.text()).toBe('usual')
  })

  // What the device holds is read as "large" only where it is this module's own mark.
  it('takes nothing but its own mark for large', () => {
    for (const stale of ['true', 'large', '0', '']) {
      window.localStorage.setItem(KEY('member-1'), stale)
      expect(readChatWindowLarge('member-1')).toBe(false)
    }
    window.localStorage.setItem(KEY('member-1'), '1')
    expect(readChatWindowLarge('member-1')).toBe(true)
  })

  it('reads and writes nothing for nobody', () => {
    window.localStorage.setItem('chat-window-large:', '1')
    window.localStorage.setItem('chat-window-large:null', '1')
    window.localStorage.setItem('chat-window-large:undefined', '1')
    for (const nobody of [null, undefined, '']) {
      expect(readChatWindowLarge(nobody)).toBe(false)
      rememberChatWindowLarge(nobody, true)
    }
    expect(Object.keys(window.localStorage).sort()).toEqual([
      'chat-window-large:',
      'chat-window-large:null',
      'chat-window-large:undefined',
    ])
  })

  // Storage switched off, or full: the usual window, and the switch still turns it.
  it('is the usual window, and still turns, where the device refuses its storage', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    const { wrapper, api } = openWindow(storeOf('member-1'))
    expect(wrapper.text()).toBe('usual')

    api().toggleLarge()
    await nextTick()
    expect(wrapper.text()).toBe('large')

    api().toggleLarge()
    await nextTick()
    expect(wrapper.text()).toBe('usual')
  })
})
