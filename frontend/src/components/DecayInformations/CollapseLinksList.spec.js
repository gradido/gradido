import { mount } from '@vue/test-utils'
import CollapseLinksList from './CollapseLinksList'

const localVue = global.localVue

const mocks = {
  $i18n: {
    locale: 'en',
  },
  $tc: jest.fn((tc) => tc),
  $t: jest.fn((t) => t),
}

const propsData = {
  transactionLinks: [
    {
      amount: '5',
      code: 'ce28664b5308c17f931c0367',
      createdAt: '2022-03-16T14:22:40.000Z',
      holdAvailableAmount: '5.13109484759482747111',
      id: 87,
      memo: 'asdasdaadsdd asd asdadss',
      redeemedAt: null,
      validUntil: '2022-03-30T14:22:40.000Z',
    },
    {
      amount: '6',
      code: 'ce28664b5308c17f931c0367',
      createdAt: '2022-03-16T14:22:40.000Z',
      holdAvailableAmount: '5.13109484759482747111',
      id: 86,
      memo: 'asdasdaadsdd asd asdadss',
      redeemedAt: null,
      validUntil: '2022-03-30T14:22:40.000Z',
    },
  ],
  transactionLinkCount: 3,
  value: { currentPage: 1, pending: false, pageSize: 5 },
}

describe('CollapseLinksList', () => {
  let wrapper

  const Wrapper = () => {
    return mount(CollapseLinksList, { localVue, mocks, propsData })
  }
  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component div.collapse-links-list', () => {
      expect(wrapper.find('div.collapse-links-list').exists()).toBeTruthy()
    })

    describe('load more links', () => {
      beforeEach(async () => {
        await wrapper.find('button.test-button-load-more').trigger('click')
      })

      it('emits input', () => {
        expect(wrapper.emitted('input')).toEqual([
          [{ currentPage: 2, pageSize: 5, pending: false }],
        ])
      })
    })

    describe('reset transaction link list', () => {
      beforeEach(async () => {
        await wrapper
          .findComponent({ name: 'TransactionLink' })
          .vm.$emit('reset-transaction-link-list')
      })

      it('emits input ', () => {
        expect(wrapper.emitted('input')).toEqual([
          [{ currentPage: 0, pageSize: 5, pending: false }],
        ])
      })
    })

    describe('button text', () => {
      describe('one more link to load', () => {
        beforeEach(async () => {
          await wrapper.setProps({
            value: { currentPage: 1, pending: false, pageSize: 5 },
          })
        })

        it('renders text in singular', () => {
          expect(mocks.$tc).toBeCalledWith('link-load', 0)
        })
      })

      describe('less than pageSize links to load', () => {
        beforeEach(async () => {
          await wrapper.setProps({
            value: { currentPage: 1, pending: false, pageSize: 5 },
            transactionLinkCount: 6,
          })
        })

        it('renders text in plural and shows the correct count of links', () => {
          expect(mocks.$tc).toBeCalledWith('link-load', 1, { n: 4 })
        })
      })

      describe('more than pageSize links to load', () => {
        beforeEach(async () => {
          await wrapper.setProps({
            value: { currentPage: 1, pending: false, pageSize: 5 },
            transactionLinkCount: 16,
          })
        })

        it('renders text in plural with page size links to load', () => {
          expect(mocks.$tc).toBeCalledWith('link-load', 2, { n: 5 })
        })
      })
    })
  })
})
