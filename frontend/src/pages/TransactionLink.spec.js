import { mount } from '@vue/test-utils'
import TransactionLink from './TransactionLink'
import { queryTransactionLink } from '@/graphql/queries'
import { redeemTransactionLink } from '@/graphql/mutations'
import { toastSuccessSpy, toastErrorSpy } from '@test/testSetup'

const localVue = global.localVue

const apolloQueryMock = jest.fn()
const apolloMutateMock = jest.fn()
const routerPushMock = jest.fn()

const now = new Date().toISOString()

const stubs = {
  RouterLink: true,
}

const transactionLinkValidExpireDate = () => {
  const validUntil = new Date()
  return new Date(validUntil.setDate(new Date().getDate() + 14)).toISOString()
}

apolloQueryMock.mockResolvedValue({
  data: {
    queryTransactionLink: {
      __typename: 'TransactionLink',
      id: 92,
      amount: '22',
      memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
      createdAt: '2022-03-17T16:10:28.000Z',
      validUntil: transactionLinkValidExpireDate(),
      redeemedAt: '2022-03-18T10:08:43.000Z',
      deletedAt: null,
      user: { firstName: 'Bibi', publisherId: 0, email: 'bibi@bloxberg.de' },
    },
  },
})

const mocks = {
  $t: jest.fn((t, obj = null) => (obj ? [t, obj.date].join('; ') : t)),
  $d: jest.fn((d) => d.toISOString()),
  $store: {
    state: {
      token: null,
      email: 'bibi@bloxberg.de',
    },
  },
  $apollo: {
    query: apolloQueryMock,
    mutate: apolloMutateMock,
  },
  $route: {
    params: {
      code: 'some-code',
    },
  },
  $router: {
    push: routerPushMock,
  },
}

describe('TransactionLink', () => {
  let wrapper

  const Wrapper = () => {
    return mount(TransactionLink, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.show-transaction-link-informations').exists()).toBe(true)
    })

    it('calls the queryTransactionLink query', () => {
      expect(apolloQueryMock).toBeCalledWith({
        query: queryTransactionLink,
        variables: {
          code: 'some-code',
        },
        fetchPolicy: 'no-cache',
      })
    })

    describe('deleted link', () => {
      beforeEach(() => {
        apolloQueryMock.mockResolvedValue({
          data: {
            queryTransactionLink: {
              __typename: 'TransactionLink',
              id: 92,
              amount: '22',
              memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
              createdAt: '2022-03-17T16:10:28.000Z',
              validUntil: transactionLinkValidExpireDate(),
              redeemedAt: '2022-03-18T10:08:43.000Z',
              deletedAt: now,
              user: { firstName: 'Bibi', publisherId: 0, email: 'bibi@bloxberg.de' },
            },
          },
        })
        wrapper = Wrapper()
      })

      it('has a component RedeemedTextBox', () => {
        expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).exists()).toBe(true)
      })

      it('has a link deleted text in text box', () => {
        expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).text()).toContain(
          'gdd_per_link.link-deleted; ' + now,
        )
      })
    })

    describe('expired link', () => {
      beforeEach(() => {
        apolloQueryMock.mockResolvedValue({
          data: {
            queryTransactionLink: {
              __typename: 'TransactionLink',
              id: 92,
              amount: '22',
              memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
              createdAt: '2022-03-17T16:10:28.000Z',
              validUntil: '2020-03-18T10:08:43.000Z',
              redeemedAt: '2022-03-18T10:08:43.000Z',
              deletedAt: null,
              user: { firstName: 'Bibi', publisherId: 0, email: 'bibi@bloxberg.de' },
            },
          },
        })
        wrapper = Wrapper()
      })

      it('has a component RedeemedTextBox', () => {
        expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).exists()).toBe(true)
      })

      it('has a link deleted text in text box', () => {
        expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).text()).toContain(
          'gdd_per_link.link-expired; 2020-03-18T10:08:43.000Z',
        )
      })
    })

    describe('redeemed link', () => {
      beforeEach(() => {
        apolloQueryMock.mockResolvedValue({
          data: {
            queryTransactionLink: {
              __typename: 'TransactionLink',
              id: 92,
              amount: '22',
              memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
              createdAt: '2022-03-17T16:10:28.000Z',
              validUntil: transactionLinkValidExpireDate(),
              redeemedAt: '2022-03-18T10:08:43.000Z',
              deletedAt: null,
              user: { firstName: 'Bibi', publisherId: 0, email: 'bibi@bloxberg.de' },
            },
          },
        })
        wrapper = Wrapper()
      })

      it('has a component RedeemedTextBox', () => {
        expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).exists()).toBe(true)
      })

      it('has a link deleted text in text box', () => {
        expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).text()).toContain(
          'gdd_per_link.redeemed-at; 2022-03-18T10:08:43.000Z',
        )
      })
    })

    describe('no token in store', () => {
      beforeEach(() => {
        mocks.$store.state.token = null
        apolloQueryMock.mockResolvedValue({
          data: {
            queryTransactionLink: {
              __typename: 'TransactionLink',
              id: 92,
              amount: '22',
              memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
              createdAt: '2022-03-17T16:10:28.000Z',
              validUntil: transactionLinkValidExpireDate(),
              redeemedAt: null,
              deletedAt: null,
              user: { firstName: 'Bibi', publisherId: 0, email: 'bibi@bloxberg.de' },
            },
          },
        })
        wrapper = Wrapper()
      })

      it('has a RedeemLoggedOut component', () => {
        expect(wrapper.findComponent({ name: 'RedeemLoggedOut' }).exists()).toBe(true)
      })

      it('has a link to register with code', () => {
        expect(wrapper.find('a[href="/register/some-code"]').exists()).toBe(true)
      })

      it('has a link to login with code', () => {
        expect(wrapper.find('a[href="/login/some-code"]').exists()).toBe(true)
      })
    })

    describe('token in store and own link', () => {
      beforeEach(() => {
        mocks.$store.state.token = 'token'
        apolloQueryMock.mockResolvedValue({
          data: {
            queryTransactionLink: {
              __typename: 'TransactionLink',
              id: 92,
              amount: '22',
              memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
              createdAt: '2022-03-17T16:10:28.000Z',
              validUntil: transactionLinkValidExpireDate(),
              redeemedAt: null,
              deletedAt: null,
              user: { firstName: 'Bibi', publisherId: 0, email: 'bibi@bloxberg.de' },
            },
          },
        })
        wrapper = Wrapper()
      })

      it('has a RedeemSelfCreator component', () => {
        expect(wrapper.findComponent({ name: 'RedeemSelfCreator' }).exists()).toBe(true)
      })

      it('has a no redeem text', () => {
        expect(wrapper.findComponent({ name: 'RedeemSelfCreator' }).text()).toContain(
          'gdd_per_link.no-redeem',
        )
      })

      it.skip('has a link to transaction page', () => {
        expect(wrapper.find('a[target="/transactions"]').exists()).toBe(true)
      })
    })

    describe('valid link', () => {
      beforeEach(() => {
        mocks.$store.state.token = 'token'
        apolloQueryMock.mockResolvedValue({
          data: {
            queryTransactionLink: {
              __typename: 'TransactionLink',
              id: 92,
              amount: '22',
              memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
              createdAt: '2022-03-17T16:10:28.000Z',
              validUntil: transactionLinkValidExpireDate(),
              redeemedAt: null,
              deletedAt: null,
              user: { firstName: 'Peter', publisherId: 0, email: 'peter@listig.de' },
            },
          },
        })
        wrapper = Wrapper()
      })

      it('has a RedeemValid component', () => {
        expect(wrapper.findComponent({ name: 'RedeemValid' }).exists()).toBe(true)
      })

      it('has a button with redeem text', () => {
        expect(wrapper.findComponent({ name: 'RedeemValid' }).find('button').text()).toBe(
          'gdd_per_link.redeem',
        )
      })

      describe('redeem link with success', () => {
        // let spy

        beforeEach(async () => {
          // spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
          apolloMutateMock.mockResolvedValue()
          // spy.mockImplementation(() => Promise.resolve(true))
          await wrapper.findComponent({ name: 'RedeemValid' }).find('button').trigger('click')
        })

        // it('opens the modal', () => {
        //   expect(spy).toBeCalledWith('gdd_per_link.redeem-text')
        // })

        it('calls the API', () => {
          expect(apolloMutateMock).toBeCalledWith(
            expect.objectContaining({
              mutation: redeemTransactionLink,
              variables: {
                code: 'some-code',
              },
            }),
          )
        })

        it('toasts a success message', () => {
          expect(mocks.$t).toBeCalledWith('gdd_per_link.redeem')
          expect(toastSuccessSpy).toBeCalledWith('gdd_per_link.redeemed; ')
        })

        it('pushes the route to overview', () => {
          expect(routerPushMock).toBeCalledWith('/overview')
        })
      })

      // describe('cancel redeem link', () => {
      //   let spy

      //   beforeEach(async () => {
      //     spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
      //     apolloMutateMock.mockResolvedValue()
      //     spy.mockImplementation(() => Promise.resolve(false))
      //     await wrapper.findComponent({ name: 'RedeemValid' }).find('button').trigger('click')
      //   })

      //   it('does not call the API', () => {
      //     expect(apolloMutateMock).not.toBeCalled()
      //   })

      //   it('does not toasts a success message', () => {
      //     expect(mocks.$t).not.toBeCalledWith('gdd_per_link.redeemed', { n: '22' })
      //     expect(toastSuccessSpy).not.toBeCalled()
      //   })

      //   it('does not push the route', () => {
      //     expect(routerPushMock).not.toBeCalled()
      //   })
      // })

      describe('redeem link with error', () => {
        // let spy

        beforeEach(async () => {
          // spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
          apolloMutateMock.mockRejectedValue({ message: 'Oh Noo!' })
          // spy.mockImplementation(() => Promise.resolve(true))
          await wrapper.findComponent({ name: 'RedeemValid' }).find('button').trigger('click')
        })

        it('toasts an error message', () => {
          expect(toastErrorSpy).toBeCalledWith('Oh Noo!')
        })

        it('pushes the route to overview', () => {
          expect(routerPushMock).toBeCalledWith('/overview')
        })
      })
    })

    describe('error on transaction link query', () => {
      beforeEach(() => {
        apolloQueryMock.mockRejectedValue({ message: 'Ouchh!' })
        wrapper = Wrapper()
      })

      it('toasts an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('Ouchh!')
      })
    })
  })
})
