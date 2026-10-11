// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChatBubble from './ChatBubble.vue'
import { isComputer } from '@/utils/isComputer'

/**
 * The reactions at a message (Bernd, 11.10.2026): the emoji in the bubble's foot line, and over
 * the entries of its menu the row that sets them. A file of its own beside ChatBubble.spec.js and
 * ChatBubble.menu.spec.js.
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
    locale: { value: 'de' },
  }),
}))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: () => {}, toastError: () => {} }),
}))

const THUMB = '👍'
const HEART = '❤️'
const THEIRS = {
  id: 6,
  messageUuid: 'uuid-6',
  conversationId: 3,
  sender: { communityUuid: 'home-uuid', gradidoID: 'lena-id' },
  mine: false,
  subject: null,
  body: 'Der Hofflohmarkt ist am Sonntag ab 11 Uhr.',
  createdAt: '2026-09-30T14:28:00.000Z',
  editedAt: null,
  deliveryState: null,
  notify: null,
  mailState: null,
  reactedAt: null,
  reactions: [],
}
const OWN = { ...THEIRS, id: 7, messageUuid: 'uuid-7', mine: true }
const reacted = (reactions, message = THEIRS) => ({
  ...message,
  reactions,
  reactedAt: '2026-10-11T06:30:00.000Z',
})
/** A transfer between the two, as the thread draws it: a booking, with no row of the chat. */
const TRANSFER = {
  ...THEIRS,
  id: 't-1',
  key: 't-1',
  messageUuid: null,
  transfer: true,
  subject: 'Lena hat Dir 10 GDD gesendet',
  body: 'Danke!',
}

describe('ChatBubble, the reactions to a message', () => {
  let wrapper

  const mountBubble = (message, props = {}) => {
    wrapper = mount(ChatBubble, {
      props: { message, alias: 'Lena', canReact: true, ...props },
      attachTo: document.body,
      global: {
        components: {
          'i18n-t': { props: { keypath: String }, template: '<span><slot name="name" /></span>' },
        },
        stubs: {
          IMdiDotsHorizontal: true,
          IMdiPencilOutline: true,
          IMdiReplyOutline: true,
          IMdiShareOutline: true,
          IMdiContentCopy: true,
          IMdiPlus: true,
          ChatTransferCoin: true,
        },
      },
    })
    return wrapper
  }

  const reactions = () => wrapper.find('[data-test="chat-bubble-reactions"]')
  const reaction = () => wrapper.findAll('[data-test="chat-bubble-reaction"]')
  const more = () => wrapper.find('[data-test="chat-bubble-more"]')
  const menu = () => wrapper.find('[data-test="chat-message-menu"]')
  const choice = () => wrapper.find('[data-test="chat-reaction-choice"]')
  const quick = () => wrapper.findAll('[data-test="chat-reaction-quick"]')
  const entries = () => wrapper.findAll('.chat-message-menu-item')
  const openMenu = async () => {
    await more().trigger('click')
    await flushPromises()
  }

  beforeEach(() => vi.mocked(isComputer).mockReturnValue(true))
  afterEach(() => wrapper?.unmount())

  describe('in the foot line', () => {
    it('draws nothing for a message nobody reacted to', () => {
      mountBubble(THEIRS)

      expect(reactions().exists()).toBe(false)
      // Not for a message from before the reactions either, which carries no list.
      wrapper.unmount()
      const { reactions: _none, reactedAt: _never, ...old } = THEIRS
      mountBubble(old)
      expect(reactions().exists()).toBe(false)
    })

    it('draws each emoji once, in the server’s order, inside the foot line and before the time', () => {
      mountBubble(
        reacted([
          { emoji: THUMB, count: 2, mine: false },
          { emoji: HEART, count: 1, mine: true },
        ]),
      )

      expect(reaction().map((one) => one.find('.chat-bubble-reaction-emoji').text())).toEqual([
        THUMB,
        HEART,
      ])
      const meta = wrapper.find('.chat-bubble-meta')
      expect(meta.element.contains(reactions().element)).toBe(true)
      expect(meta.element.firstElementChild).toBe(reactions().element)
      expect(
        reactions().element.compareDocumentPosition(
          wrapper.find('[data-test="chat-bubble-time"]').element,
        ) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })

    // A count of one says nothing the emoji does not say.
    it('says how many reacted only where it is more than one', () => {
      mountBubble(
        reacted([
          { emoji: THUMB, count: 3, mine: false },
          { emoji: HEART, count: 1, mine: false },
        ]),
      )

      const counts = reaction().map((one) => one.find('[data-test="chat-bubble-reaction-count"]'))
      expect(counts[0].text()).toBe('3')
      expect(counts[1].exists()).toBe(false)
    })

    it('sets one’s own apart for the eye', () => {
      mountBubble(
        reacted([
          { emoji: THUMB, count: 2, mine: false },
          { emoji: HEART, count: 1, mine: true },
        ]),
      )

      expect(reaction()[0].classes()).not.toContain('is-mine')
      expect(reaction()[1].classes()).toContain('is-mine')
    })

    /**
     * ⛔ For the ear each reaction is ONE piece: the emoji, how many where it is more than one,
     * and that it is one's own. In three pieces -- emoji, number, "von Dir" -- a reader stopped
     * three times at each, "3, von Dir" was heard as three of one's own, and "yours" could
     * belong to the emoji before it or to the one after.
     */
    it('says each reaction in one piece: the emoji, how many, and that it is one’s own', () => {
      mountBubble(
        reacted([
          { emoji: THUMB, count: 3, mine: true },
          { emoji: HEART, count: 1, mine: false },
          { emoji: '🌱', count: 1, mine: true },
          { emoji: '🎉', count: 2, mine: false },
        ]),
      )

      const said = reaction().map((one) =>
        one.find('[data-test="chat-bubble-reaction-said"]').text(),
      )
      expect(said).toEqual([
        `${THUMB} 3, chatThread.reactionMine`,
        HEART,
        '🌱, chatThread.reactionMine',
        '🎉 2',
      ])
      for (const one of reaction()) {
        expect(one.findAll('.visually-hidden')).toHaveLength(1)
        // What the eye gets is left out for the ear -- it would hear every emoji twice.
        expect(one.find('.chat-bubble-reaction-emoji').attributes('aria-hidden')).toBe('true')
        const count = one.find('[data-test="chat-bubble-reaction-count"]')
        if (count.exists()) expect(count.attributes('aria-hidden')).toBe('true')
      }
    })

    // The ear hears what the emoji are, before it hears them.
    it('leads them with a word for the ear only', () => {
      mountBubble(reacted([{ emoji: THUMB, count: 1, mine: false }]))

      const lead = reactions().element.firstElementChild
      expect(lead.textContent.trim()).toBe('chatThread.reactionsLead')
      expect(lead.classList.contains('visually-hidden')).toBe(true)
    })

    // ⛔ Not controls: a long thread would gain a stop for Tab at every emoji, and what is set
    // here is set in the menu.
    it('draws them as text, not as buttons', () => {
      mountBubble(reacted([{ emoji: THUMB, count: 1, mine: true }]))

      expect(reactions().findAll('button')).toHaveLength(0)
      expect(reactions().findAll('[tabindex]')).toHaveLength(0)
    })

    it('draws them for whoever may not react as well -- they are read by everybody', () => {
      mountBubble(reacted([{ emoji: THUMB, count: 1, mine: false }]), { canReact: false })

      expect(reaction()).toHaveLength(1)
    })

    it('draws none at a transfer, whatever it carries', () => {
      mountBubble({ ...TRANSFER, reactions: [{ emoji: THUMB, count: 1, mine: false }] })

      expect(reactions().exists()).toBe(false)
    })
  })

  describe('in the menu', () => {
    it('stands the row of reactions over the entries, where the thread allows them', async () => {
      mountBubble(THEIRS)
      await openMenu()

      expect(choice().exists()).toBe(true)
      expect(menu().element.firstElementChild).toBe(choice().element)
      expect(quick()).toHaveLength(6)
      expect(entries().length).toBeGreaterThan(0)
    })

    it('offers them at one’s own message as at somebody else’s', async () => {
      mountBubble(OWN)
      await openMenu()

      expect(choice().exists()).toBe(true)
    })

    // ⛔ Not in a conversation with a person of another community: the thread says so.
    it('offers none where the thread does not allow them, and the menu is as it was', async () => {
      mountBubble(THEIRS, { canReact: false })
      await openMenu()

      expect(choice().exists()).toBe(false)
      expect(entries().length).toBeGreaterThan(0)
    })

    it('offers none at a message the server has not filed', async () => {
      mountBubble({ ...OWN, messageUuid: null })

      // No row of the chat: nothing to answer, forward or react to -- but its words to copy.
      await openMenu()
      expect(choice().exists()).toBe(false)
    })

    // A transfer is a booking: it has no menu today, and gets none through the reactions.
    it('gives a transfer no menu', () => {
      mountBubble(TRANSFER)

      expect(more().exists()).toBe(false)
    })

    // Not by its missing uuid alone: a transfer is none of the chat's messages, whatever it
    // carries -- its reactions come with the transfers, by a rule of their own.
    it('gives a transfer no menu either should it carry a uuid one day', () => {
      mountBubble({ ...TRANSFER, messageUuid: 'uuid-of-a-transfer' })

      expect(more().exists()).toBe(false)
    })

    it('shows one’s own reaction pressed in the row', async () => {
      mountBubble(
        reacted([
          { emoji: THUMB, count: 2, mine: false },
          { emoji: HEART, count: 1, mine: true },
        ]),
      )
      await openMenu()

      const pressed = quick().filter((button) => button.attributes('aria-pressed') === 'true')
      expect(pressed.map((button) => button.text())).toEqual([HEART])
    })

    // ⛔ While a reaction to the message is on its way, the emoji of its menu take no press: read
    // off a state that is about to change, a second one would set what was meant to be taken back.
    it('lets no emoji take a press while a reaction to the message is on its way', async () => {
      mountBubble(THEIRS, { reactionUnderway: true })
      await openMenu()

      expect(choice().classes()).toContain('is-busy')
      await quick()[0].trigger('click')
      await flushPromises()

      expect(wrapper.emitted('react')).toBeUndefined()
      // The menu stays: nothing was chosen.
      expect(menu().exists()).toBe(true)

      await wrapper.setProps({ reactionUnderway: false })
      expect(choice().classes()).not.toContain('is-busy')
      await quick()[0].trigger('click')
      expect(wrapper.emitted('react')).toEqual([[{ message: THEIRS, emoji: THUMB }]])
    })

    // ⛔ The first ENTRY, not the first emoji: a second Enter on the sign that opened the menu
    // must not set a reaction nobody chose.
    it('puts the keyboard on the first entry when it opens, not on an emoji', async () => {
      mountBubble(THEIRS)
      await openMenu()

      expect(document.activeElement).toBe(entries()[0].element)
      expect(document.activeElement.getAttribute('data-test')).toBe('chat-message-reply')
    })

    it('hands the message and the emoji up, closes, and puts the keyboard back on its sign', async () => {
      const message = reacted([{ emoji: HEART, count: 1, mine: true }])
      mountBubble(message)
      await openMenu()

      await quick()[0].trigger('click')
      await flushPromises()

      expect(wrapper.emitted('react')).toEqual([[{ message, emoji: THUMB }]])
      expect(menu().exists()).toBe(false)
      expect(document.activeElement).toBe(more().element)
    })

    // What a press on one's own means -- taking it back -- the thread decides: the bubble hands
    // up the emoji as it was pressed.
    it('hands up a press on one’s own reaction as it is', async () => {
      const message = reacted([{ emoji: HEART, count: 1, mine: true }])
      mountBubble(message)
      await openMenu()

      await quick()
        .find((button) => button.text() === HEART)
        .trigger('click')

      expect(wrapper.emitted('react')).toEqual([[{ message, emoji: HEART }]])
    })

    it('shows all forty-eight in the place of the entries behind "mehr", and hands one of them up', async () => {
      mountBubble(THEIRS)
      await openMenu()

      await wrapper.find('[data-test="chat-reaction-more"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-test="chat-reaction-grid"]').exists()).toBe(true)
      expect(entries()).toHaveLength(0)
      await wrapper
        .findAll('[data-test="chat-reaction-emoji"]')
        .find((button) => button.text() === '🍰')
        .trigger('click')
      await flushPromises()
      expect(wrapper.emitted('react')).toEqual([[{ message: THEIRS, emoji: '🍰' }]])
      expect(menu().exists()).toBe(false)
    })

    // Opened again, the menu is the menu: the six and the entries, not the forty-eight left open.
    it('begins with the row and the entries again the next time it opens', async () => {
      mountBubble(THEIRS)
      await openMenu()
      await wrapper.find('[data-test="chat-reaction-more"]').trigger('click')
      await flushPromises()
      await more().trigger('click')
      await flushPromises()
      expect(menu().exists()).toBe(false)

      await openMenu()

      expect(quick()).toHaveLength(6)
      expect(entries().length).toBeGreaterThan(0)
    })

    it('opens on a phone by a tap on the message, with the row', async () => {
      vi.mocked(isComputer).mockReturnValue(false)
      mountBubble(THEIRS)

      await wrapper.find('.chat-bubble').trigger('click')
      await flushPromises()

      expect(choice().exists()).toBe(true)
      expect(quick()).toHaveLength(6)
    })
  })

  /**
   * Where the menu stands (11.10.2026). In the thread, at its message, wherever the thread can
   * hold it -- as before the reactions. Over the page where the thread is lower than the menu:
   * on a phone whose browser leaves 375 x 553 the thread stands from 238 to 445, and the menu at
   * one's own message is 266 px high with its reactions. What stood out of the thread was cut
   * off -- the row of reactions first --, and a press where it would have been met "Gradido
   * senden" (measured in the built wallet).
   *
   * jsdom lays nothing out: the sizes are given, as they were measured.
   */
  describe('where the menu stands', () => {
    const SCREEN = { width: 375, height: 553 }
    const FRAME = 13
    const ROW = 57
    const ENTRY = 49
    const ALL = 216
    const MENU_WIDTH = 301
    const heightOf = (element) =>
      element.querySelector('[data-test="chat-reaction-grid"]')
        ? FRAME + ALL
        : FRAME + ROW + element.querySelectorAll('.chat-message-menu-item').length * ENTRY
    let shown
    let saved
    let box
    let rowAt

    /** The bubble in a thread of this height, the message at `rowAt` on the screen. */
    const inThread = (height, top = 238) => {
      if (!box) {
        box = document.createElement('div')
        box.className = 'chat-thread-box'
        wrapper.element.parentNode.replaceChild(box, wrapper.element)
        box.appendChild(wrapper.element)
        wrapper.element.getBoundingClientRect = () => ({ ...rowAt, left: 24, right: 351 })
      }
      box.getBoundingClientRect = () => ({ top, bottom: top + height, left: 24, right: 351 })
      Object.defineProperty(box, 'clientHeight', { value: height, configurable: true })
    }
    const spot = () => ({ left: menu().element.style.left, top: menu().element.style.top })

    beforeEach(() => {
      shown = []
      box = null
      rowAt = { top: 380, bottom: 430 }
      saved = {
        rect: Element.prototype.getBoundingClientRect,
        height: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight'),
        innerHeight: window.innerHeight,
      }
      Element.prototype.scrollIntoView = function (options) {
        shown.push({ element: this, options })
      }
      // The menu where the thread's stylesheet would put it, in its size.
      Element.prototype.getBoundingClientRect = function () {
        if (!this.classList.contains('chat-message-menu')) return saved.rect.call(this)
        const height = heightOf(this)
        return { left: 26, top: 178, width: MENU_WIDTH, height, right: 327, bottom: 178 + height }
      }
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        get() {
          return this.classList.contains('chat-message-menu') ? heightOf(this) : 0
        },
      })
      Object.defineProperty(document.documentElement, 'clientWidth', {
        configurable: true,
        value: SCREEN.width,
      })
      window.innerHeight = SCREEN.height
    })
    afterEach(() => {
      wrapper?.unmount()
      wrapper = null
      box?.remove()
      delete Element.prototype.scrollIntoView
      Element.prototype.getBoundingClientRect = saved.rect
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', saved.height)
      delete document.documentElement.clientWidth
      window.innerHeight = saved.innerHeight
    })

    /**
     * The room above a message has to hold whichever is higher: the row over the entries, or
     * all forty-eight, which "mehr" puts in their place -- the menu stays on its side of the
     * message. 258 px with three entries (the forty-eight are higher), 290 px with four.
     */
    it.each([
      ['three entries', THEIRS, 258],
      ['four entries', OWN, 290],
    ])(
      'asks above a message for the room of the reactions over %s, or of all forty-eight',
      async (_, message, room) => {
        mountBubble(message)
        inThread(800, 100)

        rowAt = { top: 100 + room - 1, bottom: 100 + room + 49 }
        await openMenu()
        expect(menu().classes()).toContain('is-below')
        await more().trigger('click')

        rowAt = { top: 100 + room, bottom: 100 + room + 50 }
        await openMenu()
        expect(menu().classes()).not.toContain('is-below')
      },
    )

    it('stands in the thread wherever the thread can hold it, and is brought into sight there', async () => {
      mountBubble(OWN)
      inThread(405, 247)

      await openMenu()

      expect(menu().classes()).not.toContain('is-hung')
      expect(spot()).toEqual({ left: '', top: '' })
      expect(shown).toEqual([{ element: menu().element, options: { block: 'nearest' } }])
    })

    it('hangs over the page where the thread is lower than the menu: whole on the screen, at its message', async () => {
      mountBubble(OWN)
      inThread(207)

      await openMenu()

      expect(menu().classes()).toContain('is-hung')
      // Over the message (380 - 6 - 266), its right end where the message's is (351 - 301).
      expect(spot()).toEqual({ left: '50px', top: '108px' })
      // Nothing in the thread moves for it.
      expect(shown).toEqual([])
      // And the keyboard is on its first entry, as in the thread.
      expect(document.activeElement.getAttribute('data-test')).toBe('chat-message-reply')
    })

    it('keeps to the left at somebody else’s message there', async () => {
      mountBubble(THEIRS)
      inThread(207)

      await openMenu()

      // Three entries: 13 + 57 + 3 * 49 = 217 px high.
      expect(spot()).toEqual({ left: '24px', top: `${380 - 6 - 217}px` })
    })

    // The menu and a gap on either side: 266 + 12.
    it('counts a thread as high enough from the menu’s height and its gaps on', async () => {
      mountBubble(OWN)
      inThread(278)
      await openMenu()
      expect(menu().classes()).not.toContain('is-hung')
      await more().trigger('click')

      inThread(277)
      await openMenu()
      expect(menu().classes()).toContain('is-hung')
    })

    /**
     * "mehr" changes the menu's height: all forty-eight are 229 px, the row over three entries
     * 217. The menu is settled again -- brought into sight in the thread, or hung over the page
     * if the thread holds the one and not the other.
     */
    it('settles the menu again when "mehr" has changed its height', async () => {
      mountBubble(THEIRS)
      inThread(405, 247)
      await openMenu()
      expect(shown).toHaveLength(1)

      await wrapper.find('[data-test="chat-reaction-more"]').trigger('click')
      await flushPromises()

      expect(menu().classes()).not.toContain('is-hung')
      expect(shown).toEqual([
        { element: menu().element, options: { block: 'nearest' } },
        { element: menu().element, options: { block: 'nearest' } },
      ])
    })

    it('hangs it over the page for all forty-eight where the thread held the row and the entries', async () => {
      mountBubble(THEIRS)
      inThread(235)
      await openMenu()
      expect(menu().classes()).not.toContain('is-hung')

      await wrapper.find('[data-test="chat-reaction-more"]').trigger('click')
      await flushPromises()

      expect(menu().classes()).toContain('is-hung')
      expect(spot()).toEqual({ left: '24px', top: `${380 - 6 - 229}px` })
      // ⛔ Never hidden on the way: the keyboard stands on one of the forty-eight, and what is
      // hidden loses it.
      expect(document.activeElement.getAttribute('data-test')).toBe('chat-reaction-emoji')
      expect(menu().element.style.visibility).toBe('')
    })

    it('follows its message over the page when the thread scrolls', async () => {
      mountBubble(OWN)
      inThread(207)
      await openMenu()

      expect(spot().top).toBe('108px')

      rowAt = { top: 300, bottom: 350 }
      box.dispatchEvent(new Event('scroll'))
      await flushPromises()

      // The message went up by 80 px, and the menu with it (300 - 6 - 266).
      expect(spot()).toEqual({ left: '50px', top: '28px' })

      // Further up there is no room above it on the screen: the menu goes under it.
      rowAt = { top: 250, bottom: 262 }
      box.dispatchEvent(new Event('scroll'))
      await flushPromises()

      expect(spot().top).toBe(`${262 + 6}px`)
      expect(menu().exists()).toBe(true)
    })

    it('closes once its message has left the thread’s sight', async () => {
      mountBubble(OWN)
      inThread(207)
      await openMenu()

      rowAt = { top: 150, bottom: 200 }
      box.dispatchEvent(new Event('scroll'))
      await flushPromises()

      expect(menu().exists()).toBe(false)
    })

    // In the thread the menu moves with its message by itself: a scroll places nothing.
    it('leaves a menu in the thread where the thread has it', async () => {
      mountBubble(OWN)
      inThread(405, 247)
      await openMenu()

      rowAt = { top: 150, bottom: 200 }
      box.dispatchEvent(new Event('scroll'))
      await flushPromises()

      expect(menu().exists()).toBe(true)
      expect(spot()).toEqual({ left: '', top: '' })
    })

    it('settles again when the window changes its size', async () => {
      mountBubble(OWN)
      inThread(207)
      await openMenu()
      expect(menu().classes()).toContain('is-hung')

      // The keyboard of the phone went away: the thread is high enough now.
      inThread(405)
      window.dispatchEvent(new Event('resize'))
      await flushPromises()

      expect(menu().classes()).not.toContain('is-hung')
      expect(spot()).toEqual({ left: '', top: '' })
      expect(shown).toHaveLength(1)
    })

    /**
     * Three listeners while the menu is open -- a press elsewhere, a scroll, the window's size --
     * and each of them taken off again when it closes: a thread of fifty messages whose menus
     * were opened once would otherwise ask fifty closed menus at every press.
     */
    it('takes off every listener it put on, when it closes', async () => {
      const on = [vi.spyOn(document, 'addEventListener'), vi.spyOn(window, 'addEventListener')]
      const off = [
        vi.spyOn(document, 'removeEventListener'),
        vi.spyOn(window, 'removeEventListener'),
      ]
      const kinds = (spies) =>
        spies
          .flatMap((spy) => spy.mock.calls)
          .filter(([kind]) => ['pointerdown', 'scroll', 'resize'].includes(kind))
      mountBubble(OWN)
      inThread(405, 247)

      await openMenu()
      const put = kinds(on)
      expect(put.map(([kind]) => kind).sort()).toEqual(['pointerdown', 'resize', 'scroll'])
      expect(kinds(off)).toEqual([])

      await more().trigger('click')
      await flushPromises()

      // The same functions, with the same options: only those take a listener off.
      const taken = kinds(off)
      expect(taken).toHaveLength(3)
      for (const [kind, listener, options] of put) {
        expect(taken).toContainEqual([kind, listener, ...(options === undefined ? [] : [options])])
      }
      for (const spy of [...on, ...off]) spy.mockRestore()
    })

    it('listens to nothing once it is closed', async () => {
      mountBubble(OWN)
      inThread(207)
      await openMenu()
      await more().trigger('click')
      await flushPromises()
      expect(menu().exists()).toBe(false)

      inThread(405)
      window.dispatchEvent(new Event('resize'))
      box.dispatchEvent(new Event('scroll'))
      await flushPromises()

      expect(shown).toEqual([])
      expect(menu().exists()).toBe(false)
    })

    // Opened again in a thread that holds it, the menu stands in the thread: nothing is left of
    // the place it hung at.
    it('forgets where it hung when it closes', async () => {
      mountBubble(OWN)
      inThread(207)
      await openMenu()
      await more().trigger('click')
      await flushPromises()

      inThread(405)
      await openMenu()

      expect(menu().classes()).not.toContain('is-hung')
      expect(spot()).toEqual({ left: '', top: '' })
    })
  })

  /**
   * ⛔ What keeps a first reaction from moving the thread: the stylesheet, and only it. jsdom
   * lays nothing out, so the rules are read from the source with the comments taken out; the
   * heights themselves are measured in the built wallet (measure-reactions.mjs).
   */
  describe('the stylesheet of the foot line', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'ChatBubble.vue'),
      'utf8',
    )
    const style = source.slice(source.indexOf('<style')).replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = (selector) =>
      style.match(
        new RegExp(`\\n${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`),
      )?.[1] ?? ''

    // The line is 0.7rem at the bubble's line height of 1.4. A reaction is drawn higher than
    // that, and counts as exactly that: what is over, its margins take back.
    it('lets a reaction take as much of the line’s height as the line has, and no more', () => {
      expect(rule('.chat-bubble-meta')).toMatch(/font-size:\s*0\.7rem/)
      expect(rule('.chat-bubble')).toMatch(/line-height:\s*1\.4/)
      const one = rule('.chat-bubble-reaction')
      const height = Number(one.match(/\n\s*height:\s*([\d.]+)em;/)[1])
      const [, above, sides, below] = one.match(/margin:\s*(-[\d.]+)em\s+(\S+)\s+(-[\d.]+)em;/)
      expect(sides).toBe('0')
      expect(height + Number(above) + Number(below)).toBeCloseTo(1.4, 10)
      expect(one).toMatch(/line-height:\s*1;/)
      expect(one).not.toMatch(/border:/)
      expect(rule('.chat-bubble-reaction-emoji')).toMatch(/line-height:\s*1;/)
      // The emoji fits into what is drawn.
      const emoji = Number(rule('.chat-bubble-reaction-emoji').match(/font-size:\s*([\d.]+)em/)[1])
      expect(emoji).toBeLessThan(height)
    })

    // ⛔ Measured at 320 px in a group: with the reactions beside it the hour gave way and broke
    // between its digits.
    it('keeps the hour, the word "bearbeitet" and the mail sign whole beside the reactions', () => {
      const kept = rule('.chat-bubble-mailed,\n.chat-bubble-edited,\n.chat-bubble-time')
      expect(kept).toMatch(/flex:\s*0 0 auto/)
      expect(kept).toMatch(/white-space:\s*nowrap/)
    })

    // ⛔ The foot line is drawn at 75 % in the dark mode: on the line itself that dimmed the emoji
    // in it too.
    it('draws the reactions at full strength in the dark mode, the quiet words at 75 %', () => {
      const dim = style.match(/\n([^{}]*)\{\s*opacity:\s*0\.75;\s*\}/)[1]
      expect(dim).toContain('.dark-mode .chat-bubble-meta > :not(.chat-bubble-reactions)')
      expect(dim).not.toMatch(/\.dark-mode \.chat-bubble-meta\s*,/)
    })

    // Not words of the message: marking its text and copying takes none of them along.
    it('keeps the reactions out of what is marked', () => {
      expect(rule('.chat-bubble-reactions')).toMatch(/user-select:\s*none/)
    })

    it('draws one’s own rim inside, so that it adds no size', () => {
      expect(rule('.chat-bubble-reaction.is-mine')).toMatch(/box-shadow:\s*inset/)
      expect(rule('.chat-bubble-reaction.is-mine')).not.toMatch(/border|padding|height/)
    })

    // ⛔ The rim is all that tells the eye which reaction is one's own: in the gold that changes
    // with the mode. The plain gold came to 2.6 : 1 on the light bubbles (measured 11.10.2026).
    it('draws that rim in the gold of the menus’ signs, which can be told from every bubble', () => {
      expect(rule('.chat-bubble-reaction.is-mine')).toContain('var(--menu-icon, #a8732a)')
      expect(rule('.chat-bubble-reaction.is-mine')).not.toContain('--gold')
    })

    it('stands them at the left end of the line, and lets many break into a second one', () => {
      expect(rule('.chat-bubble-reactions')).toMatch(/margin-right:\s*auto/)
      expect(rule('.chat-bubble-reactions')).toMatch(/flex-wrap:\s*wrap/)
    })

    it('draws the emoji in the device’s own coloured font', () => {
      expect(rule('.chat-bubble-reaction-emoji')).toMatch(
        /font-family:\s*'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji'/,
      )
    })
  })
})
