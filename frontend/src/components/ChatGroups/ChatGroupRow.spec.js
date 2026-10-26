// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import ChatGroupRow from './ChatGroupRow.vue'
import { LIST_AVATAR_SIZE } from '@/constants'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) =>
      typeof values === 'number'
        ? `${key}:${values}`
        : values
          ? `${key} ${JSON.stringify(values)}`
          : key,
    d: (date, format) => `${format}(${date.toISOString()})`,
    n: (value) => `n(${value})`,
  }),
}))

// The group display shares the contacts' separator, and with it their module's import of the
// zoom, which reaches for the app's i18n instance.
vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
}))

const GROUP = {
  groupUuid: 'cafe-uuid',
  conversationId: 41,
  title: 'Gradido-Café Berlin',
  communityName: 'KI Playground',
  role: 'OWNER',
  mutedByMe: false,
  memberCount: 5,
  unreadMessages: 0,
  lastMessageAt: '2026-09-29T07:02:00.000Z',
}

const mountRow = (group = {}) =>
  mount(ChatGroupRow, {
    props: { group: { ...GROUP, ...group } },
    global: {
      mocks: {
        $t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
      },
    },
  })

// The rules of a component's style block, by selector, with the comments taken out.
const rulesOf = (file) => {
  const code = readFileSync(join(dirname(fileURLToPath(import.meta.url)), file), 'utf8')
    .split('<style')[1]
    .replace(/^[^>]*>/, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
  const rules = new Map()
  for (const [, selectors, body] of code.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const declarations = Object.fromEntries(
      body
        .split(';')
        .map((part) => part.split(':').map((half) => half.trim().replace(/\s+/g, ' ')))
        .filter(([name]) => name),
    )
    for (const selector of selectors.split(',')) rules.set(selector.trim(), declarations)
  }
  return rules
}

describe('ChatGroupRow', () => {
  it('shows the name, the community and how many and how recently', () => {
    const row = mountRow()
    expect(row.find('[data-test="chat-group-title"]').text()).toBe('Gradido-Café Berlin')
    expect(row.find('[data-test="chat-group-community"]').text()).toBe('KI Playground')
    expect(row.find('[data-test="chat-group-meta"]').text()).toBe(
      'chatGroup.memberCount:5 · contacts.last {"date":"short(2026-09-29T07:02:00.000Z)"}',
    )
  })

  it('has no community line where the server names none', () => {
    expect(
      mountRow({ communityName: null }).find('[data-test="chat-group-community"]').exists(),
    ).toBe(false)
  })

  // The square of a group beside the circles of the people, at the size of every list.
  it("draws the group's square with its letters, at the size of the lists", () => {
    const avatar = mountRow().find('.app-avatar')
    expect(avatar.classes()).toContain('app-avatar-rounded')
    expect(avatar.text()).toBe('GB')
    expect(avatar.attributes('style')).toContain(`width: ${LIST_AVATAR_SIZE}px`)
    // No picture, so nothing to open (E-050 F3).
    expect(avatar.element.tagName).toBe('DIV')
  })

  it('says which group was tapped', async () => {
    const row = mountRow()
    await row.find('[data-test="chat-group-row-open"]').trigger('click')
    expect(row.emitted('open')).toEqual([[expect.objectContaining({ groupUuid: 'cafe-uuid' })]])
  })

  describe('the gold dot', () => {
    it('stands while something waits unread, inside the button', () => {
      const row = mountRow({ unreadMessages: 3 })
      const dot = row.find(
        '[data-test="chat-group-row-open"] [data-test="chat-unread-contact-dot"]',
      )
      expect(dot.exists()).toBe(true)
      expect(dot.text()).toBe('contacts.unreadChatMessages {"n":3}')
    })

    it('is not there where nothing waits', () => {
      expect(mountRow().find('[data-test="chat-unread-contact-dot"]').exists()).toBe(false)
    })

    // Muting holds back the mails, not the messages (E-024): the menu counts a muted group too.
    it('stands in a muted group as well', () => {
      const row = mountRow({ unreadMessages: 1, mutedByMe: true })
      expect(row.find('[data-test="chat-unread-contact-dot"]').exists()).toBe(true)
    })

    // Beside the last line, the latest message (E-085): the rule below says where.
    it('carries the rule that sets it beside the last line', () => {
      const dot = mountRow({ unreadMessages: 3 }).find('[data-test="chat-unread-contact-dot"]')
      expect(dot.classes()).toContain('chat-group-row-dot')
    })
  })

  describe('the crossed bell', () => {
    it('marks a group the member muted, with words for the ear', () => {
      const mark = mountRow({ mutedByMe: true }).find('[data-test="chat-group-muted"]')
      expect(mark.exists()).toBe(true)
      expect(mark.attributes('role')).toBe('img')
      expect(mark.attributes('aria-label')).toBe('chatGroup.muted')
    })

    it('is not there where the group is not muted', () => {
      expect(mountRow().find('[data-test="chat-group-muted"]').exists()).toBe(false)
    })

    // A mark, not a control: the bell that switches it is in the group's window.
    it('is no button', () => {
      const mark = mountRow({ mutedByMe: true }).find('[data-test="chat-group-muted"]')
      expect(mark.element.tagName).not.toBe('BUTTON')
      expect(mark.find('button').exists()).toBe(false)
    })
  })

  /**
   * ⛔ The dots of the group rows and the contact rows stand in one line only while the row's end
   * is as wide as the contact row's heart column: the heart and the column's gutter. This holds
   * the two files together -- a heart of another size moves every contact's dot.
   */
  describe("the heart's room", () => {
    const heart = rulesOf('../FavoriteHeart.vue').get('.favorite-heart-icon')
    const row = rulesOf('ChatGroupRow.vue')

    it('is the heart and the gutter', () => {
      // the heart's em is the button's 1rem
      const size = heart.width.replace(/em$/, '')
      expect(heart.height).toBe(heart.width)
      expect(row.get('.chat-group-row-end')['min-width']).toBe(
        `calc(${size}rem + var(--bs-gutter-x, 1.5rem))`,
      )
    })

    it("holds a crossed bell of the heart's size", () => {
      const size = heart.width.replace(/em$/, '')
      expect(row.get('.chat-group-row-muted-icon')).toMatchObject({
        width: `${size}rem`,
        height: `${size}rem`,
      })
      const mark = mountRow({ mutedByMe: true }).find('[data-test="chat-group-muted"]')
      expect(mark.find('.chat-group-row-muted-icon').exists()).toBe(true)
    })
  })

  /**
   * ⛔ The dot beside the last line, the latest message (E-085): at the foot of the text, raised
   * by half of what a line of small text leaves around it. The two rows share the rule, so the
   * dots of the two lists stand at one height, and the 9 px in it is the dot's own size.
   */
  describe('the dot beside the last line', () => {
    const dot = rulesOf('ChatGroupRow.vue').get('.chat-group-row-dot')

    it('stands at the foot of the text, raised to the middle of a line of small text', () => {
      expect(dot).toEqual({
        'align-self': 'flex-end',
        'margin-bottom': 'calc((1.2em - 9px) / 2)',
      })
    })

    it("is the contact row's rule", () => {
      const contact = rulesOf('../Contacts/ContactRow.vue').get('.contact-row-dot')
      expect(contact).toBeDefined()
      expect(contact).toEqual(dot)
    })

    it("reckons with the dot's own size", () => {
      expect(rulesOf('../Chat/ChatUnreadDot.vue').get('.chat-unread-contact-dot')).toMatchObject({
        width: '9px',
        height: '9px',
      })
    })
  })

  /**
   * The line of the latest message (E-083): who wrote it and the beginning of its words, instead
   * of the community's line -- a group is named a community only where it is the member's own
   * (chatGroupsOf) --, and always the last line of the row, as in the contact row (E-085).
   */
  describe('the line of the latest message', () => {
    const FROM_ELFI = {
      mine: false,
      excerpt: 'Morgen um zehn im Garten?',
      hasImage: false,
      amount: null,
      senderUser: { communityUuid: 'home', gradidoID: 'elfi-id', alias: 'Elfi' },
    }
    const lineOf = (row) => row.find('[data-test="chat-preview-line"]')

    it("stands instead of the community's line, with who wrote it", () => {
      const row = mountRow({ chatPreview: FROM_ELFI })
      expect(row.find('[data-test="chat-group-community"]').exists()).toBe(false)
      expect(lineOf(row).text()).toBe('chatPreview.by {"name":"Elfi"} Morgen um zehn im Garten?')
    })

    it('stands last, under how many and how recently', () => {
      const row = mountRow({ chatPreview: FROM_ELFI })
      const text = row.find('[data-test="chat-group-row-open"]').text()
      expect(text.indexOf('Gradido-Café Berlin')).toBeLessThan(
        text.indexOf('chatGroup.memberCount:5'),
      )
      expect(text.indexOf('chatGroup.memberCount:5')).toBeLessThan(text.indexOf('Morgen um zehn'))
      expect([...row.find('.chat-group-row-text').element.children].at(-1)).toBe(
        lineOf(row).element,
      )
    })

    it('leaves the community where the group has no message yet', () => {
      const row = mountRow({ chatPreview: null, lastMessageAt: null })
      expect(lineOf(row).exists()).toBe(false)
      expect(row.find('[data-test="chat-group-community"]').text()).toBe('KI Playground')
    })

    it("is dark while something waits unread, and not for one's own message", () => {
      expect(lineOf(mountRow({ chatPreview: FROM_ELFI, unreadMessages: 3 })).classes()).toContain(
        'fw-semibold',
      )
      expect(
        lineOf(mountRow({ chatPreview: FROM_ELFI, unreadMessages: 0 })).classes(),
      ).not.toContain('fw-semibold')
      expect(
        lineOf(
          mountRow({
            chatPreview: { ...FROM_ELFI, mine: true, senderUser: null },
            unreadMessages: 3,
          }),
        ).classes(),
      ).not.toContain('fw-semibold')
    })
  })
})
