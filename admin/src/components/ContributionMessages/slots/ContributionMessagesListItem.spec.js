import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ContributionMessagesListItem from './ContributionMessagesListItem.vue'
import MemberAvatar from '@/components/MemberAvatar.vue'
import { fetchMemberAvatars, forgetAllMemberAvatars } from '@/composables/useMemberAvatars'
import { closeMemberAvatarZoom, memberAvatarZoomState } from '@/composables/useMemberAvatarZoom'
import { LIST_AVATAR_SIZE } from '@/constants'

// The avatar builds its label through `useI18n`, which needs an i18n instance this file does
// not install.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) }),
}))

vi.mock('@/components/ContributionMessages/ParseMessage', () => ({
  default: {
    name: 'ParseMessage',
    template: '<div>{{ message }}</div>',
    props: ['message'],
  },
}))

const createWrapper = (propsData) => {
  return mount(ContributionMessagesListItem, {
    props: propsData,
    global: {
      mocks: {
        $t: (key) => key,
        $d: vi.fn((date) => date.toISOString()),
        $n: vi.fn((n) => n.toString()),
        $store: {
          state: {
            moderator: {
              firstName: 'Peter',
              lastName: 'Lustig',
            },
          },
        },
      },
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
