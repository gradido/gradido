import { mount } from '@vue/test-utils'
import ContributionMessagesList from './ContributionMessagesList.vue'
import ContributionMessagesListItem from './ContributionMessagesListItem.vue'

const localVue = global.localVue
let wrapper

const dateMock = jest.fn((d) => d)

const mocks = {
  $t: jest.fn((t) => t),
  $d: dateMock,
  $store: {
    state: {
      firstName: 'Peter',
      lastName: 'Lustig',
    },
  },
}

describe('ContributionMessagesList', () => {
  const propsData = {
    contributionId: 42,
    state: 'PENDING',
    messages: [
      {
        id: 111,
        message: 'Lorem ipsum?',
        createdAt: '2022-08-29T12:23:27.000Z',
        updatedAt: null,
        type: 'DIALOG',
        userFirstName: 'Peter',
        userLastName: 'Lustig',
        userId: 107,
        __typename: 'ContributionMessage',
      },
      {
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
    ],
  }

  const ListWrapper = () => {
    return mount(ContributionMessagesList, {
      localVue,
      mocks,
      propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = ListWrapper()
    })

    it('has two DIV .contribution-messages-list-item elements', () => {
      expect(wrapper.findAll('div.contribution-messages-list-item').length).toBe(2)
    })
  })
})

describe('ContributionMessagesListItem', () => {
  describe('if message author has moderator role', () => {
    const propsData = {
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

      it('has a DIV .is-moderator.text-left', () => {
        expect(wrapper.find('div.is-moderator.text-left').exists()).toBe(true)
      })

      it('has the complete user name', () => {
        expect(wrapper.find('div.is-moderator.text-left > span:nth-child(2)').text()).toBe(
          'Bibi Bloxberg',
        )
      })

      it('has the message creation date', () => {
        expect(wrapper.find('div.is-moderator.text-left > span:nth-child(3)').text()).toMatch(
          'Mon Aug 29 2022 12:25:34 GMT+0000',
        )
      })

      it('has the moderator label', () => {
        expect(wrapper.find('div.is-moderator.text-left > small:nth-child(4)').text()).toBe(
          'community.moderator',
        )
      })

      it('has the message', () => {
        expect(wrapper.find('div.is-moderator.text-left > div:nth-child(5)').text()).toBe(
          'Asda sdad ad asdasd, das Ass das Das.',
        )
      })
    })
  })

  describe('if message author does not have moderator role', () => {
    const propsData = {
      message: {
        id: 111,
        message: 'Lorem ipsum?',
        createdAt: '2022-08-29T12:23:27.000Z',
        updatedAt: null,
        type: 'DIALOG',
        userFirstName: 'Peter',
        userLastName: 'Lustig',
        userId: 107,
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

      it('has a DIV .is-not-moderator.text-right', () => {
        expect(wrapper.find('div.is-not-moderator.text-right').exists()).toBe(true)
      })

      it('has the complete user name', () => {
        expect(wrapper.find('div.is-not-moderator.text-right > span:nth-child(2)').text()).toBe(
          'Peter Lustig',
        )
      })

      it('has the message creation date', () => {
        expect(wrapper.find('div.is-not-moderator.text-right > span:nth-child(3)').text()).toMatch(
          'Mon Aug 29 2022 12:23:27 GMT+0000',
        )
      })

      it('has the message', () => {
        expect(wrapper.find('div.is-not-moderator.text-right > div:nth-child(4)').text()).toBe(
          'Lorem ipsum?',
        )
      })
    })
  })

  describe('links in contribtion message', () => {
    const propsData = {
      message: {
        id: 111,
        message: 'Lorem ipsum?',
        createdAt: '2022-08-29T12:23:27.000Z',
        updatedAt: null,
        type: 'DIALOG',
        userFirstName: 'Peter',
        userLastName: 'Lustig',
        userId: 107,
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

    let messageField

    describe('message of only one link', () => {
      beforeEach(() => {
        propsData.message.message = 'https://gradido.net/de/'
        wrapper = ModeratorItemWrapper()
        messageField = wrapper.find('div.is-not-moderator.text-right > div:nth-child(4)')
      })

      it('contains the link as text', () => {
        expect(messageField.text()).toBe('https://gradido.net/de/')
      })

      it('contains a link to the given address', () => {
        expect(messageField.find('a').attributes('href')).toBe('https://gradido.net/de/')
      })
    })

    describe('message with text and two links', () => {
      beforeEach(() => {
        propsData.message.message = `Here you find all you need to know about Gradido: https://gradido.net/de/
and here is the link to the repository: https://github.com/gradido/gradido`
        wrapper = ModeratorItemWrapper()
        messageField = wrapper.find('div.is-not-moderator.text-right > div:nth-child(4)')
      })

      it('contains the whole text', () => {
        expect(messageField.text())
          .toBe(`Here you find all you need to know about Gradido: https://gradido.net/de/
and here is the link to the repository: https://github.com/gradido/gradido`)
      })

      it('contains the two links', () => {
        expect(messageField.findAll('a').at(0).attributes('href')).toBe('https://gradido.net/de/')
        expect(messageField.findAll('a').at(1).attributes('href')).toBe(
          'https://github.com/gradido/gradido',
        )
      })
    })
  })

  describe('contribution message type HISTORY', () => {
    const propsData = {
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
        __typename: 'ContributionMessage',
      },
    }

    const itemWrapper = () => {
      return mount(ContributionMessagesListItem, {
        localVue,
        mocks,
        propsData,
      })
    }

    let messageField

    describe('render HISTORY message', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        wrapper = itemWrapper()
        messageField = wrapper.find('div.is-not-moderator.text-right > div:nth-child(4)')
      })

      it('renders the date', () => {
        expect(dateMock).toBeCalledWith(
          new Date('Sun Nov 13 2022 13:05:48 GMT+0100 (Central European Standard Time'),
          'short',
        )
      })

      it('renders the amount', () => {
        expect(messageField.text()).toContain('350.00 GDD')
      })

      it('contains the link as text', () => {
        expect(messageField.text()).toContain(
          'This message also contains a link: https://gradido.net/de/',
        )
      })

      it('contains a link to the given address', () => {
        expect(messageField.find('a').attributes('href')).toBe('https://gradido.net/de/')
      })
    })
  })
})
