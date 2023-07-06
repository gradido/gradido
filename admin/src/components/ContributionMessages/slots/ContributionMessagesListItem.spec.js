import { mount } from '@vue/test-utils'
import ContributionMessagesListItem from './ContributionMessagesListItem'

const localVue = global.localVue

const dateMock = jest.fn((d) => d)
const numberMock = jest.fn((n) => n)

describe('ContributionMessagesListItem', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $d: dateMock,
    $n: numberMock,
    $store: {
      state: {
        moderator: {
          firstName: 'Peter',
          lastName: 'Lustig',
        },
      },
    },
  }

  describe('if message author has moderator role', () => {
    const propsData = {
      contributionId: 42,
      contributionUserId: 108,
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

      it('has the complete user name', () => {
        expect(wrapper.find('[data-test="moderator-name"]').text()).toBe('Peter Lustig')
      })

      it('has the message creation date', () => {
        expect(wrapper.find('[data-test="moderator-date"]').text()).toMatch(
          'Mon Aug 29 2022 12:23:27 GMT+0000',
        )
      })

      it('has the moderator label', () => {
        expect(wrapper.find('[data-test="moderator-label"]').text()).toBe('moderator.moderator')
      })

      it('has the message', () => {
        expect(wrapper.find('[data-test="moderator-message"]').text()).toBe('Lorem ipsum?')
      })
    })
  })

  describe('if message author does not have moderator role', () => {
    const propsData = {
      contributionId: 42,
      contributionUserId: 108,
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
        expect(wrapper.find('div.text-left.is-user').exists()).toBe(true)
      })

      it('has the complete user name', () => {
        expect(wrapper.find('[data-test="user-name"]').text()).toBe('Bibi Bloxberg')
      })

      it('has the message creation date', () => {
        expect(wrapper.find('[data-test="user-date"]').text()).toMatch(
          'Mon Aug 29 2022 12:25:34 GMT+0000',
        )
      })

      it('has the message', () => {
        expect(wrapper.find('[data-test="user-message"]').text()).toBe(
          'Asda sdad ad asdasd, das Ass das Das.',
        )
      })
    })
  })

  describe('links in contribtion message', () => {
    const propsData = {
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
        messageField = wrapper.find('[data-test="moderator-message"]')
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
        messageField = wrapper.find('[data-test="moderator-message"]')
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
        messageField = wrapper
      })

      it('renders the date', () => {
        expect(dateMock).toBeCalledWith(
          new Date('Sun Nov 13 2022 13:05:48 GMT+0100 (Central European Standard Time'),
          'short',
        )
      })

      it('renders the amount', () => {
        expect(numberMock).toBeCalledWith(350, 'decimal')
        expect(messageField.text()).toContain('350 GDD')
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
