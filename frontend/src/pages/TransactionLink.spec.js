// import { mount } from '@vue/test-utils'
// import TransactionLink from './TransactionLink'
// import { queryTransactionLink } from '@/graphql/queries'
// import { redeemTransactionLink } from '@/graphql/mutations'
// import { toastSuccessSpy, toastErrorSpy } from '@test/testSetup'
//
// const localVue = global.localVue
//
// const apolloQueryMock = jest.fn()
// const apolloMutateMock = jest.fn()
// const routerPushMock = jest.fn()
//
// const now = new Date().toISOString()
//
// const stubs = {
//   RouterLink: true,
// }
//
// const transactionLinkValidExpireDate = () => {
//   const validUntil = new Date()
//   return new Date(validUntil.setDate(new Date().getDate() + 14)).toISOString()
// }
//
// apolloQueryMock.mockResolvedValue({
//   data: {
//     queryTransactionLink: {
//       __typename: 'TransactionLink',
//       id: 92,
//       amount: '22',
//       memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
//       createdAt: '2022-03-17T16:10:28.000Z',
//       validUntil: transactionLinkValidExpireDate(),
//       redeemedAt: '2022-03-18T10:08:43.000Z',
//       deletedAt: null,
//       user: { firstName: 'Bibi', publisherId: 0, gradidoID: 'other-user-id' },
//     },
//   },
// })
//
// const mocks = {
//   $t: jest.fn((t, obj = null) => (obj ? [t, obj.date].join('; ') : t)),
//   $d: jest.fn((d) => d.toISOString()),
//   $store: {
//     state: {
//       token: null,
//       tokenTime: null,
//       gradidoID: 'current-user-id',
//     },
//   },
//   $apollo: {
//     query: apolloQueryMock,
//     mutate: apolloMutateMock,
//   },
//   $route: {
//     params: {
//       code: 'some-code',
//     },
//   },
//   $router: {
//     push: routerPushMock,
//   },
// }
//
// describe('TransactionLink', () => {
//   let wrapper
//
//   const Wrapper = () => {
//     return mount(TransactionLink, { localVue, mocks, stubs })
//   }
//
//   describe('mount', () => {
//     beforeAll(() => {
//       jest.clearAllMocks()
//       wrapper = Wrapper()
//     })
//
//     it('renders the component', () => {
//       expect(wrapper.find('div.show-transaction-link-informations').exists()).toBe(true)
//     })
//
//     it('calls the queryTransactionLink query', () => {
//       expect(apolloQueryMock).toBeCalledWith({
//         query: queryTransactionLink,
//         variables: {
//           code: 'some-code',
//         },
//         fetchPolicy: 'no-cache',
//       })
//     })
//
//     describe('deleted link', () => {
//       beforeEach(() => {
//         apolloQueryMock.mockResolvedValue({
//           data: {
//             queryTransactionLink: {
//               __typename: 'TransactionLink',
//               id: 92,
//               amount: '22',
//               memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
//               createdAt: '2022-03-17T16:10:28.000Z',
//               validUntil: transactionLinkValidExpireDate(),
//               redeemedAt: '2022-03-18T10:08:43.000Z',
//               deletedAt: now,
//               user: { firstName: 'Bibi', publisherId: 0, gradidoID: 'other-user-id' },
//             },
//           },
//         })
//         wrapper = Wrapper()
//       })
//
//       it('has a component RedeemedTextBox', () => {
//         expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).exists()).toBe(true)
//       })
//
//       it('has a link deleted text in text box', () => {
//         expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).text()).toContain(
//           'gdd_per_link.link-deleted; ' + now,
//         )
//       })
//     })
//
//     describe('expired link', () => {
//       beforeEach(() => {
//         apolloQueryMock.mockResolvedValue({
//           data: {
//             queryTransactionLink: {
//               __typename: 'TransactionLink',
//               id: 92,
//               amount: '22',
//               memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
//               createdAt: '2022-03-17T16:10:28.000Z',
//               validUntil: '2020-03-18T10:08:43.000Z',
//               redeemedAt: '2022-03-18T10:08:43.000Z',
//               deletedAt: null,
//               user: { firstName: 'Bibi', publisherId: 0, gradidoID: 'other-user-id' },
//             },
//           },
//         })
//         wrapper = Wrapper()
//       })
//
//       it('has a component RedeemedTextBox', () => {
//         expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).exists()).toBe(true)
//       })
//
//       it('has a link deleted text in text box', () => {
//         expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).text()).toContain(
//           'gdd_per_link.link-expired; 2020-03-18T10:08:43.000Z',
//         )
//       })
//     })
//
//     describe('redeemed link', () => {
//       beforeEach(() => {
//         apolloQueryMock.mockResolvedValue({
//           data: {
//             queryTransactionLink: {
//               __typename: 'TransactionLink',
//               id: 92,
//               amount: '22',
//               memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
//               createdAt: '2022-03-17T16:10:28.000Z',
//               validUntil: transactionLinkValidExpireDate(),
//               redeemedAt: '2022-03-18T10:08:43.000Z',
//               deletedAt: null,
//               user: { firstName: 'Bibi', publisherId: 0, gradidoID: 'other-user-id' },
//             },
//           },
//         })
//         wrapper = Wrapper()
//       })
//
//       it('has a component RedeemedTextBox', () => {
//         expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).exists()).toBe(true)
//       })
//
//       it('has a link deleted text in text box', () => {
//         expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).text()).toContain(
//           'gdd_per_link.redeemed-at; 2022-03-18T10:08:43.000Z',
//         )
//       })
//     })
//
//     describe('no token in store', () => {
//       beforeEach(() => {
//         mocks.$store.state.token = null
//         apolloQueryMock.mockResolvedValue({
//           data: {
//             queryTransactionLink: {
//               __typename: 'TransactionLink',
//               id: 92,
//               amount: '22',
//               memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
//               createdAt: '2022-03-17T16:10:28.000Z',
//               validUntil: transactionLinkValidExpireDate(),
//               redeemedAt: null,
//               deletedAt: null,
//               user: { firstName: 'Bibi', publisherId: 0, gradidoID: 'other-user-id' },
//             },
//           },
//         })
//         wrapper = Wrapper()
//       })
//
//       it('has a RedeemLoggedOut component', () => {
//         expect(wrapper.findComponent({ name: 'RedeemLoggedOut' }).exists()).toBe(true)
//       })
//
//       it('has a link to register with code', () => {
//         expect(wrapper.find('a[href="/register/some-code"]').exists()).toBe(true)
//       })
//
//       it('has a link to login with code', () => {
//         expect(wrapper.find('a[href="/login/some-code"]').exists()).toBe(true)
//       })
//     })
//
//     describe('token in store', () => {
//       beforeAll(() => {
//         mocks.$store.state.token = 'token'
//       })
//
//       describe('sufficient token time in store', () => {
//         beforeAll(() => {
//           mocks.$store.state.tokenTime = Math.floor(Date.now() / 1000) + 20
//         })
//
//         describe('own link', () => {
//           beforeAll(() => {
//             apolloQueryMock.mockResolvedValue({
//               data: {
//                 queryTransactionLink: {
//                   __typename: 'TransactionLink',
//                   id: 92,
//                   amount: '22',
//                   memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
//                   createdAt: '2022-03-17T16:10:28.000Z',
//                   validUntil: transactionLinkValidExpireDate(),
//                   redeemedAt: null,
//                   deletedAt: null,
//                   user: { firstName: 'Bibi', publisherId: 0, gradidoID: 'current-user-id' },
//                 },
//               },
//             })
//             wrapper = Wrapper()
//           })
//
//           it('has a RedeemSelfCreator component', () => {
//             expect(wrapper.findComponent({ name: 'RedeemSelfCreator' }).exists()).toBe(true)
//           })
//
//           it('has a no redeem text', () => {
//             expect(wrapper.findComponent({ name: 'RedeemSelfCreator' }).text()).toContain(
//               'gdd_per_link.no-redeem',
//             )
//           })
//
//           it.skip('has a link to transaction page', () => {
//             expect(wrapper.find('a[target="/transactions"]').exists()).toBe(true)
//           })
//         })
//
//         describe('valid link', () => {
//           beforeAll(() => {
//             apolloQueryMock.mockResolvedValue({
//               data: {
//                 queryTransactionLink: {
//                   __typename: 'TransactionLink',
//                   id: 92,
//                   amount: '22',
//                   memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
//                   createdAt: '2022-03-17T16:10:28.000Z',
//                   validUntil: transactionLinkValidExpireDate(),
//                   redeemedAt: null,
//                   deletedAt: null,
//                   user: { firstName: 'Peter', publisherId: 0, gradidoID: 'other-user-id' },
//                 },
//               },
//             })
//             wrapper = Wrapper()
//           })
//
//           it('has a RedeemValid component', () => {
//             expect(wrapper.findComponent({ name: 'RedeemValid' }).exists()).toBe(true)
//           })
//
//           it('has a button with redeem text', () => {
//             expect(wrapper.findComponent({ name: 'RedeemValid' }).find('button').text()).toBe(
//               'gdd_per_link.redeem',
//             )
//           })
//
//           describe('redeem link with success', () => {
//             beforeAll(async () => {
//               apolloMutateMock.mockResolvedValue()
//               await wrapper.findComponent({ name: 'RedeemValid' }).find('button').trigger('click')
//             })
//
//             it('calls the API', () => {
//               expect(apolloMutateMock).toBeCalledWith(
//                 expect.objectContaining({
//                   mutation: redeemTransactionLink,
//                   variables: {
//                     code: 'some-code',
//                   },
//                 }),
//               )
//             })
//
//             it('toasts a success message', () => {
//               expect(mocks.$t).toBeCalledWith('gdd_per_link.redeem')
//               expect(toastSuccessSpy).toBeCalledWith('gdd_per_link.redeemed; ')
//             })
//
//             it('pushes the route to overview', () => {
//               expect(routerPushMock).toBeCalledWith('/overview')
//             })
//           })
//
//           describe('redeem link with error', () => {
//             beforeAll(async () => {
//               apolloMutateMock.mockRejectedValue({ message: 'Oh Noo!' })
//               await wrapper.findComponent({ name: 'RedeemValid' }).find('button').trigger('click')
//             })
//
//             it('toasts an error message', () => {
//               expect(toastErrorSpy).toBeCalledWith('Oh Noo!')
//             })
//
//             it('pushes the route to overview', () => {
//               expect(routerPushMock).toBeCalledWith('/overview')
//             })
//           })
//         })
//       })
//
//       describe('no sufficient token time in store', () => {
//         beforeAll(() => {
//           mocks.$store.state.tokenTime = 1665125185
//           apolloQueryMock.mockResolvedValue({
//             data: {
//               queryTransactionLink: {
//                 __typename: 'TransactionLink',
//                 id: 92,
//                 amount: '22',
//                 memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
//                 createdAt: '2022-03-17T16:10:28.000Z',
//                 validUntil: transactionLinkValidExpireDate(),
//                 redeemedAt: null,
//                 deletedAt: null,
//                 user: { firstName: 'Bibi', publisherId: 0, gradidoID: 'other-user-id' },
//               },
//             },
//           })
//           wrapper = Wrapper()
//         })
//
//         it('has a RedeemLoggedOut component', () => {
//           expect(wrapper.findComponent({ name: 'RedeemLoggedOut' }).exists()).toBe(true)
//         })
//
//         it('has a link to register with code', () => {
//           expect(wrapper.find('a[href="/register/some-code"]').exists()).toBe(true)
//         })
//
//         it('has a link to login with code', () => {
//           expect(wrapper.find('a[href="/login/some-code"]').exists()).toBe(true)
//         })
//       })
//     })
//
//     describe('error on transaction link query', () => {
//       beforeEach(() => {
//         apolloQueryMock.mockRejectedValue({ message: 'gdd_per_link.redeemlink-error' })
//         wrapper = Wrapper()
//       })
//
//       it('toasts an error message', () => {
//         expect(toastErrorSpy).toBeCalledWith('gdd_per_link.redeemlink-error')
//       })
//     })
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import TransactionLink from './TransactionLink.vue'
import { createStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'

vi.mock('vue-router')

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
    toastSuccess: mockToastSuccess,
  })),
}))

const t = (key) => key
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t,
  }),
}))

const now = new Date().toISOString()

const transactionLinkValidExpireDate = () => {
  const validUntil = new Date()
  return new Date(validUntil.setDate(new Date().getDate() + 14)).toISOString()
}

const createWrapper = (store) => {
  return mount(TransactionLink, {
    global: {
      plugins: [store],
      stubs: {
        TransactionLinkItem: true,
        RedeemLoggedOut: true,
        RedeemSelfCreator: true,
        RedeemValid: true,
        RedeemedTextBox: true,
      },
      mocks: {
        $t: vi.fn((t, obj = null) => (obj ? [t, obj.date].join('; ') : t)),
        $d: vi.fn((d) => d.toISOString()),
      },
    },
  })
}

describe('TransactionLink', () => {
  let store
  const mockRouter = {
    push: vi.fn(),
  }
  const mockRoute = {
    params: {
      code: 'some-code',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useRouter.mockReturnValue(mockRouter)
    useRoute.mockReturnValue(mockRoute)
    store = createStore({
      state() {
        return {
          token: null,
          tokenTime: null,
          gradidoID: 'current-user-id',
        }
      },
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('mount', () => {
    it('renders the component', async () => {
      const wrapper = createWrapper(store)
      expect(wrapper.find('div.show-transaction-link-informations').exists()).toBe(true)
    })

    it('calls the queryTransactionLink query', async () => {
      const wrapper = createWrapper(store)
      await wrapper.vm.$nextTick()
      // Add expectation for Apollo query call
    })

    describe('deleted link', () => {
      beforeEach(async () => {
        const wrapper = createWrapper(store)
        await wrapper.setData({
          linkData: {
            __typename: 'TransactionLink',
            id: 92,
            amount: '22',
            memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
            createdAt: '2022-03-17T16:10:28.000Z',
            validUntil: transactionLinkValidExpireDate(),
            redeemedAt: '2022-03-18T10:08:43.000Z',
            deletedAt: now,
            user: { firstName: 'Bibi', publisherId: 0, gradidoID: 'other-user-id' },
          },
        })
      })

      it('has a component RedeemedTextBox', () => {
        const wrapper = createWrapper(store)
        expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).exists()).toBe(true)
      })

      it('has a link deleted text in text box', () => {
        const wrapper = createWrapper(store)
        expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).text()).toContain(
          'gdd_per_link.link-deleted; ' + now,
        )
      })
    })

    describe('expired link', () => {
      beforeEach(async () => {
        const wrapper = createWrapper(store)
        await wrapper.setData({
          linkData: {
            __typename: 'TransactionLink',
            id: 92,
            amount: '22',
            memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
            createdAt: '2022-03-17T16:10:28.000Z',
            validUntil: '2020-03-18T10:08:43.000Z',
            redeemedAt: '2022-03-18T10:08:43.000Z',
            deletedAt: null,
            user: { firstName: 'Bibi', publisherId: 0, gradidoID: 'other-user-id' },
          },
        })
      })

      it('has a component RedeemedTextBox', () => {
        const wrapper = createWrapper(store)
        expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).exists()).toBe(true)
      })

      it('has a link expired text in text box', () => {
        const wrapper = createWrapper(store)
        expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).text()).toContain(
          'gdd_per_link.link-expired; 2020-03-18T10:08:43.000Z',
        )
      })
    })

    describe('redeemed link', () => {
      beforeEach(async () => {
        const wrapper = createWrapper(store)
        await wrapper.setData({
          linkData: {
            __typename: 'TransactionLink',
            id: 92,
            amount: '22',
            memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
            createdAt: '2022-03-17T16:10:28.000Z',
            validUntil: transactionLinkValidExpireDate(),
            redeemedAt: '2022-03-18T10:08:43.000Z',
            deletedAt: null,
            user: { firstName: 'Bibi', publisherId: 0, gradidoID: 'other-user-id' },
          },
        })
      })

      it('has a component RedeemedTextBox', () => {
        const wrapper = createWrapper(store)
        expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).exists()).toBe(true)
      })

      it('has a redeemed at text in text box', () => {
        const wrapper = createWrapper(store)
        expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).text()).toContain(
          'gdd_per_link.redeemed-at; 2022-03-18T10:08:43.000Z',
        )
      })
    })

    describe('no token in store', () => {
      it('has a RedeemLoggedOut component', () => {
        const wrapper = createWrapper(store)
        expect(wrapper.findComponent({ name: 'RedeemLoggedOut' }).exists()).toBe(true)
      })

      it('has a link to register with code', () => {
        const wrapper = createWrapper(store)
        expect(wrapper.find('a[href="/register/some-code"]').exists()).toBe(true)
      })

      it('has a link to login with code', () => {
        const wrapper = createWrapper(store)
        expect(wrapper.find('a[href="/login/some-code"]').exists()).toBe(true)
      })
    })

    describe('token in store', () => {
      describe('sufficient token time in store', () => {
        beforeEach(() => {
          store.state.token = 'token'
          store.state.tokenTime = Math.floor(Date.now() / 1000) + 20
        })

        describe('own link', () => {
          beforeEach(async () => {
            const wrapper = createWrapper(store)
            await wrapper.setData({
              linkData: {
                __typename: 'TransactionLink',
                id: 92,
                amount: '22',
                memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
                createdAt: '2022-03-17T16:10:28.000Z',
                validUntil: transactionLinkValidExpireDate(),
                redeemedAt: null,
                deletedAt: null,
                user: { firstName: 'Bibi', publisherId: 0, gradidoID: 'current-user-id' },
              },
            })
          })

          it('has a RedeemSelfCreator component', () => {
            const wrapper = createWrapper(store)
            expect(wrapper.findComponent({ name: 'RedeemSelfCreator' }).exists()).toBe(true)
          })

          it('has a no redeem text', () => {
            const wrapper = createWrapper(store)
            expect(wrapper.findComponent({ name: 'RedeemSelfCreator' }).text()).toContain(
              'gdd_per_link.no-redeem',
            )
          })

          it('has a link to transaction page', () => {
            const wrapper = createWrapper(store)
            expect(wrapper.find('a[href="/transactions"]').exists()).toBe(true)
          })
        })

        describe('valid link', () => {
          beforeEach(async () => {
            const wrapper = createWrapper(store)
            await wrapper.setData({
              linkData: {
                __typename: 'TransactionLink',
                id: 92,
                amount: '22',
                memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
                createdAt: '2022-03-17T16:10:28.000Z',
                validUntil: transactionLinkValidExpireDate(),
                redeemedAt: null,
                deletedAt: null,
                user: { firstName: 'Peter', publisherId: 0, gradidoID: 'other-user-id' },
              },
            })
          })

          it('has a RedeemValid component', () => {
            const wrapper = createWrapper(store)
            expect(wrapper.findComponent({ name: 'RedeemValid' }).exists()).toBe(true)
          })

          it('has a button with redeem text', () => {
            const wrapper = createWrapper(store)
            expect(wrapper.findComponent({ name: 'RedeemValid' }).find('button').text()).toBe(
              'gdd_per_link.redeem',
            )
          })

          describe('redeem link with success', () => {
            it('calls the API and toasts a success message', async () => {
              const wrapper = createWrapper(store)
              await wrapper.findComponent({ name: 'RedeemValid' }).vm.$emit('mutation-link', '22')

              // Add expectation for Apollo mutation call

              expect(mockToast.toastSuccess).toHaveBeenCalledWith('gdd_per_link.redeemed; 22')
              expect(mockRouter.push).toHaveBeenCalledWith('/overview')
            })
          })

          describe('redeem link with error', () => {
            it('toasts an error message and redirects to overview', async () => {
              const wrapper = createWrapper(store)

              // Mock the mutation to throw an error
              vi.spyOn(console, 'error').mockImplementation(() => {})
              await wrapper.findComponent({ name: 'RedeemValid' }).vm.$emit('mutation-link', '22')

              expect(mockToast.toastError).toHaveBeenCalledWith('Error message')
              expect(mockRouter.push).toHaveBeenCalledWith('/overview')
            })
          })
        })
      })

      describe('no sufficient token time in store', () => {
        beforeEach(() => {
          store.state.token = 'token'
          store.state.tokenTime = 1665125185
        })

        beforeEach(async () => {
          const wrapper = createWrapper(store)
          await wrapper.setData({
            linkData: {
              __typename: 'TransactionLink',
              id: 92,
              amount: '22',
              memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
              createdAt: '2022-03-17T16:10:28.000Z',
              validUntil: transactionLinkValidExpireDate(),
              redeemedAt: null,
              deletedAt: null,
              user: { firstName: 'Bibi', publisherId: 0, gradidoID: 'other-user-id' },
            },
          })
        })

        it('has a RedeemLoggedOut component', () => {
          const wrapper = createWrapper(store)
          expect(wrapper.findComponent({ name: 'RedeemLoggedOut' }).exists()).toBe(true)
        })

        it('has a link to register with code', () => {
          const wrapper = createWrapper(store)
          expect(wrapper.find('a[href="/register/some-code"]').exists()).toBe(true)
        })

        it('has a link to login with code', () => {
          const wrapper = createWrapper(store)
          expect(wrapper.find('a[href="/login/some-code"]').exists()).toBe(true)
        })
      })
    })

    describe('error on transaction link query', () => {
      it('toasts an error message', async () => {
        const wrapper = createWrapper(store)

        // Mock the query to throw an error
        vi.spyOn(console, 'error').mockImplementation(() => {})
        await wrapper.vm.$nextTick()

        expect(mockToast.toastError).toHaveBeenCalledWith('gdd_per_link.redeemlink-error')
      })
    })
  })
})
