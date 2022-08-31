import { mount } from '@vue/test-utils'
import IsModerator from './IsModerator.vue'

const localVue = global.localVue

describe('IsModerator', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $d: jest.fn((d) => d),
  }

  const propsData = {
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
    return mount(IsModerator, {
      localVue,
      mocks,
      propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV .slot-is-moderator', () => {
      expect(wrapper.find('div.slot-is-moderator').exists()).toBe(true)
    })

    it('props.message.default', () => {
      expect(wrapper.vm.$options.props.message.default.call()).toEqual({})
    })
  })
})
