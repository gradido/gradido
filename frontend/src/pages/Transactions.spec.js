import { mount } from '@vue/test-utils'
import VueApollo from 'vue-apollo'
import { createMockClient } from 'mock-apollo-client'
import { GdtEntryType } from '@/graphql/enums'
import Transactions from './Transactions'
import { listGDTEntriesQuery } from '@/graphql/queries'

import { toastErrorSpy } from '@test/testSetup'

const localVue = global.localVue
localVue.use(VueApollo)

const mockRouterReplace = jest.fn()
const windowScrollToMock = jest.fn()
window.scrollTo = windowScrollToMock

// Wolle: const apolloMock = jest.fn().mockResolvedValue({
//   data: {
//     listGDTEntries: {
//       count: 0,
//       gdtEntries: [],
//     },
//   },
// })

describe('Transactions', () => {
  let wrapper
  let mockClient
  let apolloProvider
  let requestHandlers

  const state = {
    language: 'en',
  }
  const listGDTEntriesMock = {
    data: {
      listGDTEntries: {
        count: 0,
        gdtEntries: [],
      },
    },
  }

  const mocks = {
    $store: {
      state,
      commit: jest.fn(),
    },
    $t: jest.fn((t) => t),
    $n: jest.fn((n) => String(n)),
    $d: jest.fn((d) => d),
    $i18n: {
      locale: jest.fn(() => 'en'),
    },
    // Wolle: $apollo: {
    //   query: apolloMock,
    // },
    $router: {
      replace: mockRouterReplace,
    },
  }

  const createComponentWrapper = (handlers = {}) => {
    mockClient = createMockClient()
    apolloProvider = new VueApollo({
      defaultClient: mockClient,
    })

    requestHandlers = {
      listGDTEntriesQueryHandler: jest.fn().mockResolvedValue(listGDTEntriesMock),
      ...handlers,
    }

    mockClient.setRequestHandler(listGDTEntriesQuery, requestHandlers.listGDTEntriesQueryHandler)

    wrapper = mount(Transactions, { localVue, apolloProvider, mocks })
  }
  const destroyComponentWrapper = () => {
    wrapper.destroy()
    mockClient = null
    apolloProvider = null
  }

  describe('mount', () => {
    afterEach(() => {
      destroyComponentWrapper()
    })

    describe('client response for "listGDTEntries"', () => {
      describe('with empty array', () => {
        beforeEach(async () => {
          createComponentWrapper()
          await wrapper.vm.$nextTick()
        })

        it('renders a Vue component', () => {
          expect(wrapper.exists()).toBe(true)
          expect(wrapper.vm.$apollo.queries.listGDTEntries).toBeTruthy()
        })

        it('renders the transaction table', () => {
          expect(wrapper.findComponent({ name: 'GddTransactionList' }).exists()).toBeTruthy()
        })

        it('emits update-transactions after creation', () => {
          expect(wrapper.emitted('update-transactions')).toEqual(
            expect.arrayContaining([expect.arrayContaining([{ currentPage: 1, pageSize: 25 }])]),
          )
        })

        it('emits update-transactions when update-transactions is called', () => {
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
        })
      })

      describe('with filled array', () => {
        const listGDTEntriesQueryHandlerMock = jest.fn().mockResolvedValue({
          data: {
            listGDTEntries: {
              count: 4,
              gdtEntries: [
                {
                  id: 1,
                  amount: 100,
                  gdt: 1700,
                  factor: 17,
                  comment: '',
                  date: '2021-05-02T17:20:11+00:00',
                  gdtEntryType: GdtEntryType.FORM,
                },
                {
                  id: 2,
                  amount: 1810,
                  gdt: 362,
                  factor: 0.2,
                  comment: 'Dezember 20',
                  date: '2020-12-31T12:00:00+00:00',
                  gdtEntryType: GdtEntryType.GLOBAL_MODIFICATOR,
                },
                {
                  id: 3,
                  amount: 100,
                  gdt: 1700,
                  factor: 17,
                  comment: '',
                  date: '2020-05-07T17:00:00+00:00',
                  gdtEntryType: GdtEntryType.FORM,
                },
                {
                  id: 4,
                  amount: 100,
                  gdt: 110,
                  factor: 22,
                  comment: '',
                  date: '2020-04-10T13:28:00+00:00',
                  gdtEntryType: GdtEntryType.ELOPAGE_PUBLISHER,
                },
              ],
            },
          },
        })

        beforeEach(async () => {
          createComponentWrapper({
            // we overwrite the handler here
            listGDTEntriesQueryHandler: listGDTEntriesQueryHandlerMock,
          })
          await wrapper.vm.$nextTick()
          // Wolle: wrapper.findAll('li[ role="presentation"]').at(1).find('a').trigger('click')
        })

        describe('tabs', () => {
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

            it.skip('calls the API', () => {
              expect(listGDTEntriesQueryHandlerMock).toBeCalledWith(
                expect.objectContaining({
                  variables: {
                    currentPage: 1,
                    pageSize: 25,
                  },
                }),
              )
            })

            it('scrolls to (0, 0) after API call', () => {
              expect(windowScrollToMock).toBeCalledWith(0, 0)
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

        describe('update currentPage', () => {
          beforeEach(() => {
            jest.clearAllMocks()
            wrapper.setData({
              currentPage: 2,
            })
          })

          it.skip('calls the API', () => {
            expect(listGDTEntriesQueryHandlerMock).toBeCalledWith(
              expect.objectContaining({
                variables: {
                  currentPage: 2,
                  pageSize: 25,
                },
              }),
            )
          })
        })
      })

      describe.skip('with error', () => {
        const listGDTEntriesQueryHandlerMock = jest.fn().mockRejectedValue(new Error('Ouch!'))

        beforeEach(async () => {
          createComponentWrapper({
            // we overwrite the handler here
            listGDTEntriesQueryHandler: listGDTEntriesQueryHandlerMock,
          })
          await wrapper.vm.$nextTick()
          await wrapper.vm.$nextTick()
          // Wolle: wrapper.findAll('li[ role="presentation"]').at(1).find('a').trigger('click')
        })

        describe('tabs', () => {
          describe('click on GDT tab', () => {
            beforeEach(() => {
              // Wolle: apolloMock.mockRejectedValue({ message: 'Ouch!' })
              wrapper.findAll('li[ role="presentation"]').at(1).find('a').trigger('click')
            })

            it('toasts an error message', () => {
              expect(toastErrorSpy).toBeCalledWith('Ouch!')
            })

            it('sets transactionGdtCount to -1', () => {
              expect(wrapper.vm.transactionGdtCount).toBe(-1)
            })
          })
        })
      })
    })
  })
})
