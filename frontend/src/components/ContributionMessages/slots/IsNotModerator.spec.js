import { mount } from '@vue/test-utils'
import IsNotModerator from './IsNotModerator.vue'

const localVue = global.localVue

describe('IsNotModerator', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $d: jest.fn((d) => d),
  }

  const propsData = {
    message: {
      id: 113,
      message: 'asda sdad ad asdasd ',
      createdAt: '2022-08-29T12:25:34.000Z',
      updatedAt: null,
      type: 'DIALOG',
      userFirstName: 'Bibi',
      userLastName: 'Bloxberg',
      userId: 108,
      __typename: 'ContributionMessage',
    },
  }

  const Wrapper = () => {
    return mount(IsNotModerator, {
      localVue,
      mocks,
      propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV .slot-is-not-moderator', () => {
      expect(wrapper.find('div.slot-is-not-moderator').exists()).toBe(true)
    })

    it('props.message.default', () => {
      expect(wrapper.vm.$options.props.message.default.call()).toEqual({})
    })
  })
})
