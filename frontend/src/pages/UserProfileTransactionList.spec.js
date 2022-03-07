import { mount } from '@vue/test-utils'
import UserProfileTransactionList from './UserProfileTransactionList'

const localVue = global.localVue

window.scrollTo = jest.fn()

describe('UserProfileTransactionList', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $n: jest.fn((n) => String(n)),
    $d: jest.fn((d) => d),
    $i18n: {
      locale: jest.fn(() => 'en'),
    },
  }

  const stubs = {
    GdtTransactionList: true,
  }

  const Wrapper = () => {
    return mount(UserProfileTransactionList, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the transaction table', () => {
      expect(wrapper.findComponent({ name: 'GddTransactionList' }).exists()).toBeTruthy()
    })

    it('emits update-transactions after creation', () => {
      expect(wrapper.emitted('update-transactions')).toEqual(
        expect.arrayContaining([expect.arrayContaining([{ currentPage: 1, pageSize: 25 }])]),
      )
    })

    it('emist update-transactions when update-transactions is called', () => {
      wrapper
        .findComponent({ name: 'GddTransactionList' })
        .vm.$emit('update-transactions', { currentPage: 2, pageSize: 25 })
      expect(wrapper.emitted('update-transactions')).toEqual(
        expect.arrayContaining([expect.arrayContaining([{ currentPage: 2, pageSize: 25 }])]),
      )
    })

    it('renders the transaction gradido transform table', () => {
      expect(wrapper.findComponent({ name: 'GdtTransactionList' }).exists()).toBeTruthy()
    })

    describe('tabs', () => {
      it('shows the GDD transactions by default', () => {
        expect(wrapper.findAll('div[role="tabpanel"]').at(0).isVisible()).toBeTruthy()
      })

      it('does not show the GDT transactions by default', () => {
        expect(wrapper.findAll('div[role="tabpanel"]').at(1).isVisible()).toBeFalsy()
      })

      describe('click on GDT tab', () => {
        beforeEach(() => {
          wrapper.findAll('li[ role="presentation"]').at(1).find('a').trigger('click')
        })

        it('does not show the GDD transactions', () => {
          expect(wrapper.findAll('div[role="tabpanel"]').at(0).isVisible()).toBeFalsy()
        })

        it('shows the GDT transactions', () => {
          expect(wrapper.findAll('div[role="tabpanel"]').at(1).isVisible()).toBeTruthy()
        })

        describe('click on GDD tab', () => {
          beforeEach(() => {
            wrapper.findAll('li[ role="presentation"]').at(0).find('a').trigger('click')
          })

          it('shows the GDD transactions', () => {
            expect(wrapper.findAll('div[role="tabpanel"]').at(0).isVisible()).toBeTruthy()
          })

          it('does not show the GDT', () => {
            expect(wrapper.findAll('div[role="tabpanel"]').at(1).isVisible()).toBeFalsy()
          })
        })
      })
    })
  })
})
