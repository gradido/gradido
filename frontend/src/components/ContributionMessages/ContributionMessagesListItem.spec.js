import { mount } from '@vue/test-utils'
import ContributionMessagesList from './ContributionMessagesList.vue'

const localVue = global.localVue

describe('ContributionMessagesList', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $store: {
      state: {
        firstName: 'Peter',
        lastName: 'Lustig',
      },
    },
  }

  const propsData = {
    contributionId: 42,
    state: 'PENDING0',
    messages: [
      {
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
    ],
  }

  const Wrapper = () => {
    return mount(ContributionMessagesList, {
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
  })
})
