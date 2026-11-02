import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemberAvatar } from '@/components/MemberAvatar'
import { fetchMemberAvatars, forgetAllMemberAvatars } from '@/composables/useMemberAvatars'
import { closeMemberAvatarZoom, memberAvatarZoomState } from '@/composables/useMemberAvatarZoom'
import { LIST_AVATAR_SIZE } from '@/constants'
import { ContributionMessagesListItem } from './ContributionMessagesListItem'

// The avatar builds its label through `useI18n`, which needs an i18n instance this file does
// not install.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
    d: (date) => date.toISOString(),
  }),
}))

// The parser shows what it was handed: the text, and the type it takes a change apart by.
vi.mock('@/components/ContributionMessages/ParseMessage', () => ({
  ParseMessage: {
    name: 'ParseMessage',
    template: '<div :data-type="type">{{ message }}</div>',
    props: ['message', 'type'],
  },
}))

const createWrapper = (propsData) => {
  return mount(ContributionMessagesListItem, {
    props: propsData,
    global: {
      stubs: {
        BAvatar: true,
        VariantIcon: true,
      },
    },
  })
}

describe('ContributionMessagesListItem', () => {
  describe('if message author has moderator role', () => {
    let wrapper

    beforeEach(() => {
      wrapper = createWrapper({
        contributionUserId: 108,
        message: {
          id: 111,
          message: 'Lorem ipsum?',
          createdAt: '2022-08-29T12:23:27.000Z',
          updatedAt: null,
          type: 'DIALOG',
          userAlias: 'peterl',
          userId: 107,
          isModerator: true,
        },
      })
    })

    it('has a DIV .text-end.is-moderator', () => {
      expect(wrapper.find('div.text-end.is-moderator').exists()).toBe(true)
    })

    it('has the complete user name', () => {
      expect(wrapper.find('[data-test="moderator-name"]').text()).toBe('peterl')
    })

    it('has the message creation date', () => {
      expect(wrapper.find('[data-test="moderator-date"]').text()).toBe('2022-08-29T12:23:27.000Z')
    })

    it('has the moderator label', () => {
      expect(wrapper.find('[data-test="moderator-label"]').text()).toBe('moderator.moderator')
    })

    it('has the message', () => {
      expect(wrapper.find('[data-test="moderator-message"]').text()).toBe('Lorem ipsum?')
    })
  })

  describe('if message author does not have moderator role', () => {
    let wrapper

    beforeEach(() => {
      wrapper = createWrapper({
        contributionUserId: 108,
        message: {
          id: 113,
          message: 'Asda sdad ad asdasd, das Ass das Das.',
          createdAt: '2022-08-29T12:25:34.000Z',
          updatedAt: null,
          type: 'DIALOG',
          userAlias: 'bibi',
          userId: 108,
        },
      })
    })

    it('has a DIV .text-start.is-user', () => {
      expect(wrapper.find('div.text-start.is-user').exists()).toBe(true)
    })

    it('has the complete user name', () => {
      expect(wrapper.find('[data-test="user-name"]').text()).toBe('bibi')
    })

    it('has the message creation date', () => {
      expect(wrapper.find('[data-test="user-date"]').text()).toBe('2022-08-29T12:25:34.000Z')
    })

    it('has the message', () => {
      expect(wrapper.find('[data-test="user-message"]').text()).toBe(
        'Asda sdad ad asdasd, das Ass das Das.',
      )
    })
  })

  describe('contribution message type HISTORY', () => {
    let wrapper

    beforeEach(() => {
      wrapper = createWrapper({
        contributionUserId: 108,
        message: {
          id: 111,
          message: `Sun Nov 13 2022 13:05:48 GMT+0100 (Central European Standard Time)
---
This message also contains a link: https://gradido.net/de/
---
350.00`,
          createdAt: '2022-08-29T12:23:27.000Z',
          updatedAt: null,
          type: 'HISTORY',
          userAlias: 'peterl',
          userId: 107,
        },
      })
    })

    it('renders the history label', () => {
      expect(wrapper.text()).toContain('moderator.history')
    })

    // Bernd, 25.10.2026: a change showed its raw text, date string and dashes. The parser takes
    // it apart by the message's type, which the box now hands it under the name the message
    // carries; under another name it never arrived.
    it('hands the parser the type, by which it takes a change apart', () => {
      expect(wrapper.find('[data-test="moderator-message"]').attributes('data-type')).toBe(
        'HISTORY',
      )
    })

    it('renders the message', () => {
      expect(wrapper.find('[data-test="moderator-message"]').text()).toContain(
        'Sun Nov 13 2022 13:05:48 GMT+0100 (Central European Standard Time)',
      )
      expect(wrapper.find('[data-test="moderator-message"]').text()).toContain(
        'This message also contains a link: https://gradido.net/de/',
      )
      expect(wrapper.find('[data-test="moderator-message"]').text()).toContain('350.00')
    })
  })
})

describe('the box a message stands in', () => {
  const boxOf = (message) =>
    createWrapper({
      contributionUserId: 108,
      message: {
        id: 120,
        message: 'text',
        createdAt: '2022-08-29T12:23:27.000Z',
        userAlias: 'peterl',
        ...message,
      },
    }).find('.contribution-messages-list-item > div')

  // Bernd, 25.10.2026: every message in the same neutral grey; the side says who wrote it, a
  // note and a change say what they are in their head, with the sticky note and the pencil.
  it('marks a note only the moderation sees, and says so in its head', () => {
    const box = boxOf({ type: 'MODERATOR', userId: 107 })
    expect(box.classes()).toEqual(
      expect.arrayContaining(['text-end', 'is-moderator', 'message-bubble', 'is-note']),
    )
    const kind = box.find('[data-test="message-kind"]')
    expect(kind.text()).toContain('moderator.notice')
    expect(kind.attributes('title')).toBe('moderator.notice-tooltip')
    expect(kind.find('.visually-hidden').text()).toContain('moderator.notice-tooltip')
    expect(kind.find('svg').exists()).toBe(true)
    // In place of the word "Moderator", and without the line below that said who sees it.
    expect(box.find('[data-test="moderator-label"]').exists()).toBe(false)
    expect(box.text()).not.toContain('moderator.request')
  })

  it("marks the member's change of the contribution on the member's side", () => {
    const box = boxOf({ type: 'HISTORY', userId: 108, message: 'a\n---\nb\n---\n1' })
    expect(box.classes()).toEqual(
      expect.arrayContaining(['text-start', 'is-user', 'message-bubble', 'is-change']),
    )
    expect(box.find('[data-test="message-kind"]').text()).toBe('moderator.change')
    expect(box.find('[data-test="history-label"]').text()).toBe('moderator.history')
  })

  // A change stood on the member's side whoever made it; it leans to its author now.
  it("marks the moderation's change on the moderation's side, in place of the word", () => {
    const box = boxOf({ type: 'HISTORY', userId: 107, message: 'a\n---\nb\n---\n1' })
    expect(box.classes()).toEqual(
      expect.arrayContaining(['text-end', 'is-moderator', 'message-bubble', 'is-change']),
    )
    expect(box.find('[data-test="message-kind"]').text()).toBe('moderator.change')
    expect(box.find('[data-test="moderator-label"]').exists()).toBe(false)
  })

  it('marks a message of the moderation', () => {
    const box = boxOf({ type: 'DIALOG', userId: 107 })
    expect(box.classes()).toEqual(expect.arrayContaining(['is-moderator', 'message-bubble']))
    expect(box.find('[data-test="moderator-label"]').text()).toBe('moderator.moderator')
    expect(box.find('[data-test="message-kind"]').exists()).toBe(false)
  })

  it("marks the member's own message", () => {
    const box = boxOf({ type: 'DIALOG', userId: 108 })
    expect(box.classes()).toEqual(expect.arrayContaining(['is-user', 'message-bubble']))
    expect(box.classes()).not.toContain('is-change')
    expect(box.find('[data-test="message-kind"]').exists()).toBe(false)
  })
})

/**
 * The head of a message on a phone. Its parts follow one another without a space, so as plain
 * text they were one word, and a narrow message broke it anywhere -- inside the date, inside the
 * name. As boxes of their own the line breaks between them.
 */
describe('the head of a message', () => {
  const headOf = (message) =>
    createWrapper({
      contributionUserId: 108,
      message: {
        id: 121,
        message: 'text',
        createdAt: '2022-08-29T12:23:27.000Z',
        type: 'DIALOG',
        userAlias: 'peterl',
        ...message,
      },
    })

  it.each([
    ['of the moderation', 107, ['moderator-label', 'moderator-date', 'moderator-name']],
    ['of the member', 108, ['user-name', 'user-date']],
  ])('stands in boxes of their own, %s', (_, userId, parts) => {
    const wrapper = headOf({ userId })
    for (const part of parts) {
      expect(wrapper.find(`[data-test="${part}"]`).classes(), part).toContain('d-inline-block')
    }
    // The face is a box of its own already.
    expect(wrapper.find('[data-test="member-avatar"]').classes()).toContain('d-inline-flex')
  })
})

/**
 * The faces of the dialogue (Bernd, 12.09.2026). The placeholders said "a person" about
 * everybody; now the circle carries whoever wrote the message -- their picture where they
 * show one, their letters where they do not.
 */
describe('the face beside a message', () => {
  const WHEN = '2026-09-12T04:00:00.000Z'
  const message = {
    id: 7,
    type: 'DIALOG',
    message: 'Koenntest Du das genauer beschreiben?',
    createdAt: new Date('2026-09-12T04:10:00.000Z'),
    userId: 108,
    userAlias: 'margret',
    userAvatarColorIndex: 4,
    userGradidoID: 'g-margret',
    userCommunityUuid: 'home',
    userAvatarUpdatedAt: WHEN,
  }

  const clientAnswering = (members) => ({
    query: vi.fn().mockResolvedValue({ data: { memberAvatars: members } }),
  })

  beforeEach(() => {
    forgetAllMemberAvatars()
    closeMemberAvatarZoom()
  })

  it('draws the circle at the one size this interface uses', () => {
    const wrapper = createWrapper({ contributionUserId: 108, message })

    expect(wrapper.findComponent(MemberAvatar).props('size')).toBe(LIST_AVATAR_SIZE)
  })

  /**
   * ⛔ The AUTHOR of the message, not the member the contribution belongs to and not the
   * signed-in moderator. A thread carries both sides, and taking the face from anywhere else
   * is how it ends up beside somebody else's words.
   */
  it('takes the face from the message, on both sides of the thread', async () => {
    const client = clientAnswering([
      { gradidoID: 'g-margret', communityUuid: 'home', avatar: 'her-face', avatarUpdatedAt: WHEN },
    ])
    await fetchMemberAvatars(client, [
      { gradidoID: 'g-margret', communityUuid: 'home', avatarUpdatedAt: WHEN },
    ])

    // Her own message, and one written about her by the moderation: the same author, so the
    // same face, whichever side of the thread it stands on.
    const hers = createWrapper({ contributionUserId: 108, message })
    const moderations = createWrapper({ contributionUserId: 999, message })

    expect(hers.findComponent(MemberAvatar).props('src')).toBe('data:image/jpeg;base64,her-face')
    expect(moderations.findComponent(MemberAvatar).props('src')).toBe(
      'data:image/jpeg;base64,her-face',
    )
    hers.unmount()
    moderations.unmount()
  })

  // Without a picture the circle carries the letters of the alias, coloured by the digit the
  // server computed -- the same rule as everywhere else.
  it('keeps the letters where the author shows no picture', () => {
    const wrapper = createWrapper({
      contributionUserId: 108,
      message: { ...message, userAvatarUpdatedAt: null },
    })

    const avatar = wrapper.findComponent(MemberAvatar)
    expect(avatar.props('src')).toBe('')
    expect(avatar.props('initials')).toBe('MA')
    expect(avatar.props('colorIndex')).toBe(4)
  })

  // The same rule on the other side of the interface: no alias, no hole in the label.
  it('names the picture plainly where the author has no alias', async () => {
    const client = clientAnswering([
      { gradidoID: 'g-margret', communityUuid: 'home', avatar: 'her-face', avatarUpdatedAt: WHEN },
    ])
    await fetchMemberAvatars(client, [
      { gradidoID: 'g-margret', communityUuid: 'home', avatarUpdatedAt: WHEN },
    ])
    const wrapper = createWrapper({
      contributionUserId: 108,
      message: { ...message, userAlias: null },
    })

    await wrapper.findComponent(MemberAvatar).trigger('click')

    expect(memberAvatarZoomState.value.label).toBe('avatar.zoom-picture-plain')
    wrapper.unmount()
  })

  it('opens the picture at full size on a tap', async () => {
    const client = clientAnswering([
      { gradidoID: 'g-margret', communityUuid: 'home', avatar: 'her-face', avatarUpdatedAt: WHEN },
    ])
    await fetchMemberAvatars(client, [
      { gradidoID: 'g-margret', communityUuid: 'home', avatarUpdatedAt: WHEN },
    ])
    const wrapper = createWrapper({ contributionUserId: 108, message })

    await wrapper.findComponent(MemberAvatar).trigger('click')

    expect(memberAvatarZoomState.value).toMatchObject({
      member: { gradidoID: 'g-margret', communityUuid: 'home' },
      src: 'data:image/jpeg;base64,her-face',
    })
    wrapper.unmount()
  })
})

// Every bubble in the grey of a field (Bernd, 25.10.2026), which Bootstrap turns with the mode:
// no colour of its own, light or dark. Vitest hands stylesheets to the tests as empty strings, so
// the sheet itself is read, its comments taken out first.
describe('the stylesheet of a message', () => {
  const here = dirname(fileURLToPath(import.meta.url))
  const css = readFileSync(join(here, 'ContributionMessagesListItem.css'), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  )

  it('gives every bubble the grey of a field, in both modes', () => {
    expect(css.replace(/\s+/g, ' ')).toContain(
      '.message-bubble { background-color: var(--bs-secondary-bg); }',
    )
    expect(css.match(/background-color/g)).toHaveLength(1)
    expect(css).not.toContain('data-bs-theme')
  })
})
