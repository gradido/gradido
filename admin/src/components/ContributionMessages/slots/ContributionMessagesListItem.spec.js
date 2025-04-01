import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ContributionMessagesListItem from './ContributionMessagesListItem.vue'

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
          userFirstName: 'Peter',
          userLastName: 'Lustig',
          userId: 107,
          isModerator: true,
        },
      })
    })

    it('has a DIV .text-end.is-moderator', () => {
      expect(wrapper.find('div.text-end.is-moderator').exists()).toBe(true)
    })

    it('has the complete user name', () => {
      expect(wrapper.find('[data-test="moderator-name"]').text()).toBe('Peter Lustig')
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
          userFirstName: 'Bibi',
          userLastName: 'Bloxberg',
          userId: 108,
        },
      })
    })

    it('has a DIV .text-start.is-user', () => {
      expect(wrapper.find('div.text-start.is-user').exists()).toBe(true)
    })

    it('has the complete user name', () => {
      expect(wrapper.find('[data-test="user-name"]').text()).toBe('Bibi Bloxberg')
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
          userFirstName: 'Peter',
          userLastName: 'Lustig',
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
