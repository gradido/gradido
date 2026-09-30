// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import ChatBubble from './ChatBubble.vue'
import { isComputer } from '@/utils/isComputer'

/**
 * The menu at a message and the line over a forwarded copy (Bernd, 30.09.2026, E-059): on a
 * computer the sign beside the message opens the menu, on a phone a tap on the message; forwarding
 * hands the message up, "Text kopieren" puts its words on the clipboard. A file of its own beside
 * ChatBubble.spec.js, which does not tell a computer from a phone.
 */
vi.mock('@/utils/isComputer', () => ({ isComputer: vi.fn(() => true) }))
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { query: () => new Promise(() => {}) } }),
}))
vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
    d: (date, format) => `${format}(${date.toISOString()})`,
  }),
}))
const toasts = vi.hoisted(() => ({ success: [], error: [] }))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastSuccess: (message) => toasts.success.push(message),
    toastError: (message) => toasts.error.push(message),
  }),
}))

const THEIRS = {
  id: 6,
  messageUuid: 'uuid-6',
  conversationId: 3,
  sender: { communityUuid: 'home-uuid', gradidoID: 'lena-id' },
  mine: false,
  subject: null,
  body: 'Der Hofflohmarkt ist am Sonntag ab 11 Uhr.',
  createdAt: '2026-09-30T14:28:00.000Z',
  deliveryState: null,
  notify: null,
  mailState: null,
}
const OWN = { ...THEIRS, id: 7, messageUuid: 'uuid-7', mine: true }

describe('ChatBubble, the menu at a message (E-059)', () => {
  let wrapper
  let clipboard

  const mountBubble = (message) => {
    wrapper = mount(ChatBubble, {
      props: { message, alias: 'Lena' },
      attachTo: document.body,
      global: {
        stubs: {
          IMdiDotsHorizontal: { template: '<i data-test="dots" />' },
          IMdiShare: { template: '<i data-test="forwarded-sign" />' },
          IMdiShareOutline: true,
          IMdiContentCopy: true,
          IMdiEmailOutline: true,
          IMdiCalendarPlusOutline: true,
          IMdiContentDuplicate: true,
          IMdiFileDocumentOutline: true,
          IMdiOpenInNew: true,
          IBiCopy: true,
        },
      },
    })
    return wrapper
  }

  const more = () => wrapper.find('[data-test="chat-bubble-more"]')
  const menu = () => wrapper.find('[data-test="chat-message-menu"]')
  const entry = (name) => wrapper.find(`[data-test="chat-message-${name}"]`)
  const bubble = () => wrapper.find('.chat-bubble')

  beforeEach(() => {
    vi.mocked(isComputer).mockReturnValue(true)
    toasts.success.length = 0
    toasts.error.length = 0
    clipboard = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboard },
      configurable: true,
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    delete navigator.clipboard
  })

  describe('on a computer', () => {
    it('opens the menu from the sign beside the message, with both entries, the first one focused', async () => {
      mountBubble(THEIRS)
      expect(more().attributes()).toMatchObject({
        'aria-label': 'chatThread.menuMore',
        'aria-haspopup': 'true',
        'aria-expanded': 'false',
      })
      expect(menu().exists()).toBe(false)

      await more().trigger('click')
      await flushPromises()

      expect(menu().exists()).toBe(true)
      expect(menu().attributes('aria-label')).toBe('chatThread.menuLabel')
      expect(entry('forward').text()).toContain('chatThread.forward')
      expect(entry('copy').text()).toContain('chatThread.copyText')
      expect(document.activeElement).toBe(entry('forward').element)
      expect(more().attributes('aria-expanded')).toBe('true')
      expect(wrapper.classes()).toContain('has-menu')
    })

    it('opens nothing on a click on the message itself -- that marks words there', async () => {
      mountBubble(THEIRS)
      await bubble().trigger('click')
      expect(menu().exists()).toBe(false)
    })

    it('closes with Esc, back on the sign, and on a press elsewhere', async () => {
      mountBubble(THEIRS)
      await more().trigger('click')
      await flushPromises()
      await menu().trigger('keydown', { key: 'Escape' })
      expect(menu().exists()).toBe(false)
      expect(document.activeElement).toBe(more().element)

      await more().trigger('click')
      await flushPromises()
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      await flushPromises()
      expect(menu().exists()).toBe(false)
    })

    it('keeps the menu at the side of its message', async () => {
      mountBubble(OWN)
      await more().trigger('click')
      expect(menu().classes()).toContain('is-mine')
      wrapper.unmount()

      mountBubble(THEIRS)
      await more().trigger('click')
      expect(menu().classes()).not.toContain('is-mine')
    })
  })

  describe('on a phone', () => {
    beforeEach(() => {
      vi.mocked(isComputer).mockReturnValue(false)
    })

    it('opens the menu with a tap on the message, and closes it with another', async () => {
      mountBubble(THEIRS)
      await bubble().trigger('click')
      await flushPromises()
      expect(menu().exists()).toBe(true)
      await bubble().trigger('click')
      expect(menu().exists()).toBe(false)
    })

    it('leaves a tap on a control in the message to the control', async () => {
      mountBubble({ ...THEIRS, body: 'Hier: https://example.org/flohmarkt' })
      await wrapper.find('a').trigger('click')
      expect(menu().exists()).toBe(false)
    })

    it('opens nothing where words are marked', async () => {
      mountBubble(THEIRS)
      const selection = vi
        .spyOn(window, 'getSelection')
        .mockReturnValue({ toString: () => 'Sonntag' })
      await bubble().trigger('click')
      expect(menu().exists()).toBe(false)
      selection.mockRestore()
    })
  })

  it('hands the message up to be forwarded, and closes the menu', async () => {
    mountBubble(THEIRS)
    await more().trigger('click')
    await entry('forward').trigger('click')
    expect(wrapper.emitted('forward')).toEqual([[THEIRS]])
    expect(menu().exists()).toBe(false)
  })

  it('copies the subject and the text as they were written, and says so', async () => {
    mountBubble({ ...THEIRS, subject: 'Flohmarkt', body: 'Am **Sonntag** ab 11 Uhr.' })
    await more().trigger('click')
    await entry('copy').trigger('click')
    await flushPromises()
    expect(clipboard).toHaveBeenCalledWith('Flohmarkt\n\nAm **Sonntag** ab 11 Uhr.')
    expect(toasts.success).toEqual(['chatThread.textCopied'])
    expect(menu().exists()).toBe(false)
  })

  it('says so where the clipboard refuses', async () => {
    clipboard.mockRejectedValue(new Error('denied'))
    mountBubble(THEIRS)
    await more().trigger('click')
    await entry('copy').trigger('click')
    await flushPromises()
    expect(toasts.error).toEqual(['chatThread.textNotCopied'])
  })

  it('offers no copy for a picture without words, and no forwarding for a message not filed yet', async () => {
    mountBubble({ ...THEIRS, body: '', images: [{ imageUuid: 'img-1', width: 320, height: 240 }] })
    await more().trigger('click')
    expect(entry('forward').exists()).toBe(true)
    expect(entry('copy').exists()).toBe(false)
    wrapper.unmount()

    mountBubble({ ...OWN, messageUuid: null })
    await more().trigger('click')
    expect(entry('forward').exists()).toBe(false)
    expect(entry('copy').exists()).toBe(true)
  })

  it('has no menu at a transfer, and a tap on one opens nothing', async () => {
    vi.mocked(isComputer).mockReturnValue(false)
    mountBubble({ ...THEIRS, transfer: true, subject: 'Anna hat Dir 5 Gradido gesendet' })
    expect(more().exists()).toBe(false)
    await bubble().trigger('click')
    expect(menu().exists()).toBe(false)
  })

  it('opens the menu under a message with no room above it in the thread', async () => {
    mountBubble(THEIRS)
    const box = document.createElement('div')
    box.className = 'chat-thread-box'
    box.getBoundingClientRect = () => ({ top: 100 })
    wrapper.element.parentNode.replaceChild(box, wrapper.element)
    box.appendChild(wrapper.element)
    wrapper.element.getBoundingClientRect = () => ({ top: 150 })

    await more().trigger('click')
    expect(menu().classes()).toContain('is-below')
    await more().trigger('click')

    wrapper.element.getBoundingClientRect = () => ({ top: 400 })
    await more().trigger('click')
    expect(menu().classes()).not.toContain('is-below')
  })

  it('measures that room from the beginning of the thread, and brings the whole menu into sight', async () => {
    const shown = []
    Element.prototype.scrollIntoView = function (options) {
      shown.push({ element: this, options })
    }
    mountBubble(THEIRS)
    const box = document.createElement('div')
    box.className = 'chat-thread-box'
    box.getBoundingClientRect = () => ({ top: 100 })
    Object.defineProperty(box, 'scrollTop', { value: 600, configurable: true })
    wrapper.element.parentNode.replaceChild(box, wrapper.element)
    box.appendChild(wrapper.element)
    // A tall picture half scrolled out at the top: its top over the box's, far down the thread.
    wrapper.element.getBoundingClientRect = () => ({ top: 20 })

    await more().trigger('click')
    await flushPromises()

    expect(menu().classes()).not.toContain('is-below')
    expect(shown).toEqual([{ element: menu().element, options: { block: 'nearest' } }])
    delete Element.prototype.scrollIntoView
  })

  describe('the line over a forwarded copy (E-059 F2)', () => {
    const line = () => wrapper.find('[data-test="chat-bubble-forwarded"]')

    it('names who wrote the words first', () => {
      mountBubble({
        ...OWN,
        forwarded: true,
        forwardedFrom: { gradidoID: 'anna-id', alias: 'Anna-Sonne' },
      })
      expect(line().text()).toBe('chatThread.forwardedFrom {"name":"Anna-Sonne"}')
      expect(line().find('[data-test="forwarded-sign"]').exists()).toBe(true)
    })

    it('says only that it was forwarded where the copy names nobody', () => {
      mountBubble({ ...THEIRS, forwarded: true, forwardedFrom: null })
      expect(line().text()).toBe('chatThread.forwarded')
    })

    it('stands over no other message', () => {
      mountBubble({ ...THEIRS, forwarded: false, forwardedFrom: { gradidoID: 'x', alias: 'x' } })
      expect(line().exists()).toBe(false)
    })
  })
})
