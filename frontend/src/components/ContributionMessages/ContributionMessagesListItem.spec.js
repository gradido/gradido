import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ContributionMessagesListItem from './ContributionMessagesListItem.vue'
import AppAvatar from '@/components/AppAvatar.vue'
import message from '../Message/Message.vue'
import { defineComponent, nextTick } from 'vue'
import { BCol, BRow } from 'bootstrap-vue-next'
import { forgetAllMemberAvatars, rememberMemberAvatars } from '@/composables/useMemberAvatars'
import { LIST_AVATAR_SIZE } from '@/constants'

export default defineComponent({
  computed: {
    message() {
      return message
    },
  },
})

// Mocks
const mockT = vi.fn((key) => key)
const mockD = vi.fn((date) => `Formatted: ${date}`)

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: mockT,
    d: mockD,
  }),
}))

// ⚠️ The zoom composable builds its labels through `i18n.global.t`, because a composable is
// not a setup scope. This file replaces the whole `vue-i18n` module, so `@/i18n` would find
// no `createI18n` to call -- mocked here rather than widened above, the same way the booking
// column's spec does it.
vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
}))

vi.mock('vue-avatar', () => ({
  default: {
    name: 'Avatar',
    template: '<div class="avatar-mock"></div>',
  },
}))

vi.mock('@/components/ContributionMessages/ParseMessage', () => ({
  default: {
    name: 'ParseMessage',
    template: '<div class="parse-message-mock">{{ message }}</div>',
    props: ['message'],
  },
}))

describe('ContributionMessagesListItem', () => {
  let wrapper
  const createWrapper = (propsData, store = {}) => {
    return mount(ContributionMessagesListItem, {
      props: propsData,
      global: {
        mocks: {
          $t: mockT,
          $d: mockD,
          $store: {
            state: {
              firstName: 'Peter',
              lastName: 'Lustig',
              username: 'peterl',
              ...store,
            },
          },
        },
        components: {
          BRow,
          BCol,
        },
      },
    })
  }

  describe('HISTORY message type', () => {
    beforeEach(() => {
      wrapper = createWrapper({
        message: {
          type: 'HISTORY',
          createdAt: '2022-08-29T12:23:27.000Z',
          message: 'This is a history message',
          userAlias: 'peterl',
          userAvatarColorIndex: 6,
        },
      })
    })

    it('renders the HISTORY message layout', () => {
      expect(wrapper.find('.contribution-messages-list-item > div > .mb-3.border').exists()).toBe(
        true,
      )
    })

    it('displays the formatted date', () => {
      expect(wrapper.find('small').text()).toContain('Formatted:')
    })

    it('renders ParseMessage component', () => {
      expect(wrapper.find('.parse-message-mock').exists()).toBe(true)
    })
  })

  describe('Non-moderator message', () => {
    beforeEach(() => {
      wrapper = createWrapper({
        message: {
          type: 'DIALOG',
          createdAt: '2022-08-29T12:23:27.000Z',
          message: 'User message',
          userAlias: 'peterl',
          userAvatarColorIndex: 6,
        },
      })
    })

    it('renders the non-moderator layout', () => {
      expect(wrapper.find('.is-not-moderator').exists()).toBe(true)
    })

    it('displays the member own alias', () => {
      expect(wrapper.find('[data-test="username"]').text()).toBe('peterl')
    })

    it('displays the formatted date', () => {
      expect(wrapper.find('[data-test="date"]').text()).toContain('Formatted:')
    })

    it('renders ParseMessage component', () => {
      expect(wrapper.find('.parse-message-mock').exists()).toBe(true)
    })
  })

  describe('Moderator message', () => {
    beforeEach(() => {
      wrapper = createWrapper({
        message: {
          type: 'DIALOG',
          createdAt: '2022-08-29T12:23:27.000Z',
          message: 'Moderator message',
          userAlias: 'moderator',
          userAvatarColorIndex: 4,
        },
      })
    })

    it('renders the moderator layout', () => {
      expect(wrapper.find('.is-moderator').exists()).toBe(true)
    })

    it('displays the moderator alias (NU-020)', () => {
      expect(wrapper.find('[data-test="username"]').text()).toBe('moderator')
    })

    // AS-010/NU-017: the letters follow the alias next to them, the COLOUR arrives as
    // the finished digit the server hashed from the real initials -- the name itself no
    // longer travels on the message, and no circle changes colour.
    it('letters the circle from the alias and colours it from the server digit', () => {
      const avatar = wrapper.findComponent(AppAvatar)
      expect(avatar.props('initials')).toBe('MO')
      expect(avatar.props('colorIndex')).toBe(4)
    })

    it('displays the moderator label', () => {
      expect(wrapper.find('[data-test="moderator"]').text()).toBe('community.moderator')
    })

    it('displays the formatted date', () => {
      expect(wrapper.find('[data-test="date"]').text()).toContain('Formatted:')
    })

    it('renders ParseMessage component', () => {
      expect(wrapper.find('.parse-message-mock').exists()).toBe(true)
    })
  })
  /**
   * The faces in the dialogue (ES-028, Bernd 12.09.2026): the moderation with a face and
   * the member with their own makes this a conversation between two people rather than
   * between a member and an office.
   */
  describe('the faces in the thread', () => {
    const when = '2026-09-12T04:00:00.000Z'
    const moderatorMessage = {
      type: 'DIALOG',
      createdAt: '2026-09-12T04:10:00.000Z',
      message: 'Koenntest Du das noch genauer beschreiben?',
      userAlias: 'moderator',
      userAvatarColorIndex: 4,
      userGradidoID: 'g-moderator',
      userCommunityUuid: null,
      userAvatarUpdatedAt: when,
    }

    beforeEach(() => {
      forgetAllMemberAvatars()
    })

    // One size for every list of people in the wallet, this one included.
    it('draws every circle at the one size the wallet uses', () => {
      const own = createWrapper({ message: { ...moderatorMessage, userAlias: 'peterl' } })
      const moderation = createWrapper({ message: moderatorMessage })

      expect(own.findComponent(AppAvatar).props('size')).toBe(LIST_AVATAR_SIZE)
      expect(moderation.findComponent(AppAvatar).props('size')).toBe(LIST_AVATAR_SIZE)
    })

    /**
     * ⛔ The picture of the member's own side comes from the login store, not from the
     * member-avatar store: that one holds what OTHER members show, and a member who hides
     * their picture from everybody else still sees it here.
     */
    it('shows the member their own picture, and offers it at full size', () => {
      const wrapper = createWrapper(
        { message: { ...moderatorMessage, userAlias: 'peterl' } },
        { avatar: 'my-own-picture', gradidoID: 'g-peter' },
      )

      const avatar = wrapper.findComponent(AppAvatar)
      expect(avatar.props('src')).toBe('data:image/jpeg;base64,my-own-picture')
      expect(avatar.props('zoomable')).toBe(true)
    })

    // Without a picture the circle stays exactly what it was: letters, and nothing to open.
    it('leaves the member their letters while they have no picture', () => {
      const wrapper = createWrapper({ message: { ...moderatorMessage, userAlias: 'peterl' } })

      const avatar = wrapper.findComponent(AppAvatar)
      expect(avatar.props('src')).toBe('')
      expect(avatar.props('zoomable')).toBeFalsy()
    })

    /**
     * ⛔ The same wrapper throughout, painted first and given the picture second -- which is
     * the order the wallet actually meets: the page fetches the faces once and the store
     * hands them to the threads already on screen.
     */
    it('gives the moderation its face once the page has fetched it', async () => {
      const wrapper = createWrapper({ message: moderatorMessage })
      const avatar = () => wrapper.findComponent(AppAvatar)

      // The same row without a picture first, so what follows is demonstrably about the
      // picture and not about the row.
      expect(avatar().props('src')).toBe('')
      expect(avatar().props('zoomable')).toBeFalsy()

      rememberMemberAvatars([
        {
          gradidoID: 'g-moderator',
          communityUuid: null,
          avatar: 'the-face',
          avatarUpdatedAt: when,
        },
      ])
      await nextTick()

      expect(avatar().props('src')).toBe('data:image/jpeg;base64,the-face')
      expect(avatar().props('zoomable')).toBe(true)
      expect(avatar().props('zoomLabel')).toContain('moderator')
    })

    // A moderation that shows no picture looks exactly as it did before this.
    it('keeps the letters where the moderation shows no picture', () => {
      const wrapper = createWrapper({
        message: { ...moderatorMessage, userAvatarUpdatedAt: null, userGradidoID: 'g-moderator' },
      })

      const avatar = wrapper.findComponent(AppAvatar)
      expect(avatar.props('src')).toBe('')
      expect(avatar.props('initials')).toBe('MO')
      expect(avatar.props('colorIndex')).toBe(4)
      expect(avatar.props('zoomable')).toBeFalsy()
    })
  })
})
