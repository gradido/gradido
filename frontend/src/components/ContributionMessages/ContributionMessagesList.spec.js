import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ContributionMessagesList } from './ContributionMessagesList'
import { BButton } from 'bootstrap-vue-next'

// The thread translates through useI18n, where the template read $t.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

// Mock child components
vi.mock('@/components/ContributionMessages/ContributionMessagesListItem', () => ({
  ContributionMessagesListItem: {
    name: 'ContributionMessagesListItem',
    template: '<div class="contribution-messages-list-item-mock"></div>',
    props: ['message'],
  },
}))

vi.mock('@/components/ContributionMessages/ContributionMessagesFormular', () => ({
  ContributionMessagesFormular: {
    name: 'ContributionMessagesFormular',
    template: '<div class="contribution-messages-formular-mock"></div>',
    props: ['contributionId'],
  },
}))

describe('ContributionMessagesList', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(ContributionMessagesList, {
      props: {
        contributionId: 42,
        status: 'IN_PROGRESS',
        messages: [],
        ...props,
      },
      global: {
        components: {
          BButton,
        },
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          IBiArrowUpShort: true,
        },
        directives: {
          bToggle: {},
        },
      },
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('has a DIV .contribution-messages-list', () => {
      expect(wrapper.find('div.contribution-messages-list').exists()).toBe(true)
    })

    it('has a Component ContributionMessagesFormular', () => {
      expect(wrapper.findComponent({ name: 'ContributionMessagesFormular' }).exists()).toBe(true)
    })

    it('renders ContributionMessagesListItem for each message', async () => {
      await wrapper.setProps({
        messages: [{ id: 1 }, { id: 2 }],
      })
      expect(wrapper.findAll('.contribution-messages-list-item-mock').length).toBe(2)
    })

    it('does not render ContributionMessagesFormular when status is not PENDING or IN_PROGRESS', async () => {
      await wrapper.setProps({ status: 'COMPLETED' })
      expect(wrapper.findComponent({ name: 'ContributionMessagesFormular' }).exists()).toBe(false)
    })

    it('renders the button that folds the thread away', () => {
      expect(wrapper.find('button').text()).toContain('form.collapse')
    })

    it('takes a reply in the states another thread names, and in no other', async () => {
      const support = ['OPEN', 'IN_PROGRESS', 'CLOSED']
      await wrapper.setProps({ status: 'CLOSED', replyStates: support })
      expect(wrapper.findComponent({ name: 'ContributionMessagesFormular' }).exists()).toBe(true)
      await wrapper.setProps({ status: 'DELETED' })
      expect(wrapper.findComponent({ name: 'ContributionMessagesFormular' }).exists()).toBe(false)
    })
  })
})
