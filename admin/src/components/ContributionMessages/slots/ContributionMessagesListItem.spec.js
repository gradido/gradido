import { mount } from '@vue/test-utils'
import ContributionMessagesListItem from './ContributionMessagesListItem.vue'

const localVue = global.localVue

describe('ContributionMessagesListItem', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $d: jest.fn((d) => d),
  }

  describe('if message author has moderator role', () => {
    const propsData = {
      contributionId: 42,
      state: 'PENDING',
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
        __typename: 'ContributionMessage',
      },
    }

    const ModeratorItemWrapper = () => {
      return mount(ContributionMessagesListItem, {
        localVue,
        mocks,
        propsData,
      })
    }

    describe('mount', () => {
      beforeAll(() => {
        wrapper = ModeratorItemWrapper()
      })

      it('has a DIV .text-right.is-moderator', () => {
        expect(wrapper.find('div.text-right.is-moderator').exists()).toBe(true)
      })
    })
  })

  describe('if message author does not have moderator role', () => {
    const propsData = {
      contributionId: 42,
      state: 'PENDING',
      message: {
        id: 113,
        message: 'Asda sdad ad asdasd, das Ass das Das. ',
        createdAt: '2022-08-29T12:25:34.000Z',
        updatedAt: null,
        type: 'DIALOG',
        userFirstName: 'Bibi',
        userLastName: 'Bloxberg',
        userId: 108,
        __typename: 'ContributionMessage',
      },
    }

    const ItemWrapper = () => {
      return mount(ContributionMessagesListItem, {
        localVue,
        mocks,
        propsData,
      })
    }

    describe('mount', () => {
      beforeAll(() => {
        wrapper = ItemWrapper()
      })

      it('has a DIV .text-left.is-not-moderator', () => {
        expect(wrapper.find('div.text-left.is-not-moderator').exists()).toBe(true)
      })
    })
  })
})
