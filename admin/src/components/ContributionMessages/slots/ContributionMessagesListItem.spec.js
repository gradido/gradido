import { mount } from '@vue/test-utils'
import ContributionMessagesListItem from './ContributionMessagesListItem.vue'

const localVue = global.localVue

describe('ContributionMessagesListItem', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $d: jest.fn((d) => d),
    $store: {
      state: {
        moderator: {
          id: 107,
        },
      },
    },
  }

  const propsData = {
    contributionId: 42,
    state: 'PENDING0',
    message: {
      id: 111,
      message: 'asd asda sda sda',
      createdAt: '2022-08-29T12:23:27.000Z',
      updatedAt: null,
      type: 'DIALOG',
      userFirstName: 'Peter',
      userLastName: 'Lustig',
      userId: 107,
      __typename: 'ContributionMessage',
    },
  }

  const Wrapper = () => {
    return mount(ContributionMessagesListItem, {
      localVue,
      mocks,
      propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV .contribution-messages-list-item', () => {
      expect(wrapper.find('div.contribution-messages-list-item').exists()).toBe(true)
    })

    it('props.message.default', () => {
      expect(wrapper.vm.$options.props.message.default.call()).toEqual({})
    })
  })
})
