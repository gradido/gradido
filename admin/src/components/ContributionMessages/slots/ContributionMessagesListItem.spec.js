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

vi.mock('@/components/ContributionMessages/ParseMessage', () => ({
  ParseMessage: {
    name: 'ParseMessage',
    template: '<div>{{ message }}</div>',
    props: ['message'],
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

  it('marks a note only the moderation sees, and says so', () => {
    const box = boxOf({ type: 'MODERATOR', userId: 107 })
    expect(box.classes()).toEqual(
      expect.arrayContaining(['text-end', 'is-moderator', 'is-moderator-hidden-message']),
    )
    expect(box.text()).toContain('moderator.request')
  })

  it("marks the history of the member's own contribution", () => {
    const box = boxOf({ type: 'HISTORY', userId: 108, message: 'a\n---\nb\n---\n1' })
    expect(box.classes()).toEqual(
      expect.arrayContaining(['text-start', 'is-user', 'is-user-history-message']),
    )
    expect(box.text()).toContain('moderator.history')
  })

  it('marks a message of the moderation', () => {
    const box = boxOf({ type: 'DIALOG', userId: 107 })
    expect(box.classes()).toEqual(expect.arrayContaining(['is-moderator', 'is-moderator-message']))
    expect(box.text()).not.toContain('moderator.request')
  })

  it("marks the member's own message", () => {
    const box = boxOf({ type: 'DIALOG', userId: 108 })
    expect(box.classes()).toEqual(expect.arrayContaining(['is-user', 'is-user-message']))
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
