import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ContributionMessagesListItem from './ContributionMessagesListItem.vue'
import message from '../Message/Message.vue'
import { defineComponent } from 'vue'
import { BCol, BRow } from 'bootstrap-vue-next'

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
          userFirstName: 'Peter',
          userLastName: 'Lustig',
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
          userFirstName: 'Peter',
          userLastName: 'Lustig',
        },
      })
    })

    it('renders the non-moderator layout', () => {
      expect(wrapper.find('.is-not-moderator').exists()).toBe(true)
    })

    it('displays the user name', () => {
      expect(wrapper.find('[data-test="username"]').text()).toBe('Peter Lustig')
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
          userFirstName: 'Mod',
          userLastName: 'Erator',
        },
      })
    })

    it('renders the moderator layout', () => {
      expect(wrapper.find('.is-moderator').exists()).toBe(true)
    })

    it('displays the moderator name', () => {
      expect(wrapper.find('[data-test="username"]').text()).toBe('Mod Erator')
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
})
