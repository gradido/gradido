import { mount } from '@vue/test-utils'
import TransactionLinksSummary from './TransactionLinkSummary'
import { listTransactionLinks } from '@/graphql/queries'
import { toastErrorSpy } from '../../../test/testSetup'

const localVue = global.localVue

const apolloQueryMock = jest.fn()

const mocks = {
  $i18n: {
    locale: 'en',
  },
  $t: jest.fn((t) => t),
  $d: jest.fn((d) => d),
  $tc: jest.fn((tc) => tc),
  $apollo: {
    query: apolloQueryMock,
  },
  $store: {
    state: {
      firstName: 'Bibi',
      lastName: 'Bloxberg',
    },
  },
}

const propsData = {
  amount: '123',
  decay: {
    decay: '-0.2038314055482643084',
    start: '2022-02-25T07:29:26.000Z',
    end: '2022-02-28T13:55:47.000Z',
    duration: 282381,
  },
  transactionLinkCount: 4,
}

describe('TransactionLinkSummary', () => {
  let wrapper

  const Wrapper = () => {
    return mount(TransactionLinksSummary, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      apolloQueryMock.mockResolvedValue({
        data: {
          listTransactionLinks: [
            {
              amount: '75',
              link: 'http://localhost/redeem/ce28664b5308c17f931c0367',
              createdAt: '2022-03-16T14:22:40.000Z',
              holdAvailableAmount: '5.13109484759482747111',
              id: 86,
              memo:
                'Hokuspokus Haselnuss, Vogelbein und Fliegenfuß, damit der Trick gelingen muss!',
              redeemedAt: null,
              validUntil: '2022-03-30T14:22:40.000Z',
            },
            {
              amount: '85',
              link: 'http://localhost/redeem/ce28664b5308c17f931c0367',
              createdAt: '2022-03-16T14:22:40.000Z',
              holdAvailableAmount: '5.13109484759482747111',
              id: 107,
              memo: 'Mäusespeck und Katzenbuckel, Tricks und Tracks und Zauberkugel!',
              redeemedAt: null,
              validUntil: '2022-03-30T14:22:40.000Z',
            },
            {
              amount: '95',
              link: 'http://localhost/redeem/ce28664b5308c17f931c0367',
              createdAt: '2022-03-16T14:22:40.000Z',
              holdAvailableAmount: '5.13109484759482747111',
              id: 92,
              memo:
                'Abrakadabra 1,2,3, die Sonne kommt herbei. Schweinepups und Spuckebrei, der Regen ist vorbei.',
              redeemedAt: null,
              validUntil: '2022-03-30T14:22:40.000Z',
            },
            {
              amount: '150',
              link: 'http://localhost/redeem/ce28664b5308c17f931c0367',
              createdAt: '2022-03-16T14:22:40.000Z',
              holdAvailableAmount: '5.13109484759482747111',
              id: 16,
              memo:
                'Abrakadabra 1,2,3 was verschwunden ist komme herbei.Wieseldreck und Schweinemist, zaubern das ist keine List.',
              redeemedAt: null,
              validUntil: '2022-03-30T14:22:40.000Z',
            },
          ],
        },
      })

      wrapper = Wrapper()
    })

    it('renders the component transaction-slot-link', () => {
      expect(wrapper.find('div.transaction-slot-link').exists()).toBe(true)
    })

    it('has a component CollapseLinksList', () => {
      expect(wrapper.findComponent({ name: 'CollapseLinksList' }).exists()).toBe(true)
    })

    describe('click on transaction links', () => {
      beforeEach(async () => {
        wrapper.find('div.row').trigger('click')
      })

      it('calls the API to get the list transaction links', () => {
        expect(apolloQueryMock).toBeCalledWith({
          query: listTransactionLinks,
          variables: {
            currentPage: 1,
          },
          fetchPolicy: 'network-only',
        })
      })

      it('has four transactionLinks', () => {
        expect(wrapper.vm.transactionLinks).toHaveLength(4)
      })

      describe('close transaction link details', () => {
        beforeEach(() => {
          jest.clearAllMocks()
          wrapper.find('div.row').trigger('click')
        })

        it('does not call the API', () => {
          expect(apolloQueryMock).not.toBeCalled()
        })

        it('has no component CollapseLinksList', () => {
          expect(wrapper.findComponent({ name: 'CollapseLinksList' }).isVisible()).toBe(false)
        })

        describe('reopen transaction link details', () => {
          beforeEach(() => {
            jest.clearAllMocks()
            wrapper.find('div.row').trigger('click')
          })

          it('calls the API to get the list transaction links', () => {
            expect(apolloQueryMock).toBeCalledWith({
              query: listTransactionLinks,
              variables: {
                currentPage: 1,
              },
              fetchPolicy: 'network-only',
            })
          })

          it('has four transactionLinks', () => {
            expect(wrapper.vm.transactionLinks).toHaveLength(4)
          })
        })
      })

      describe('load more transaction links', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          apolloQueryMock.mockResolvedValue({
            data: {
              listTransactionLinks: [
                {
                  amount: '76',
                  link: 'http://localhost/redeem/ce28664b5308c17f931c0367',
                  createdAt: '2022-03-16T14:22:40.000Z',
                  holdAvailableAmount: '5.13109484759482747111',
                  id: 87,
                  memo:
                    'Hat jemand die Nummer von der Hexe aus Schneewittchen? Ich bräuchte mal ein paar Äpfel.',
                  redeemedAt: null,
                  validUntil: '2022-03-30T14:22:40.000Z',
                },
                {
                  amount: '86',
                  link: 'http://localhost/redeem/ce28664b5308c17f931c0367',
                  createdAt: '2022-03-16T14:22:40.000Z',
                  holdAvailableAmount: '5.13109484759482747111',
                  id: 108,
                  memo:
                    'Die Windfahn´ krächzt am Dach, Der Uhu im Geklüfte; Was wispert wie ein Ach Verhallend in die Lüfte?',
                  redeemedAt: null,
                  validUntil: '2022-03-30T14:22:40.000Z',
                },
                {
                  amount: '96',
                  link: 'http://localhost/redeem/ce28664b5308c17f931c0367',
                  createdAt: '2022-03-16T14:22:40.000Z',
                  holdAvailableAmount: '5.13109484759482747111',
                  id: 93,
                  memo:
                    'Verschlafen kräht der Hahn, Ein Blitz noch, und ein trüber, Umwölbter Tag bricht an – Walpurgisnacht vorüber!',
                  redeemedAt: null,
                  validUntil: '2022-03-30T14:22:40.000Z',
                },
                {
                  amount: '150',
                  link: 'http://localhost/redeem/ce28664b5308c17f931c0367',
                  createdAt: '2022-03-16T14:22:40.000Z',
                  holdAvailableAmount: '5.13109484759482747111',
                  id: 17,
                  memo: 'Eene meene Flaschenschrank, fertig ist der Hexentrank!',
                  redeemedAt: null,
                  validUntil: '2022-03-30T14:22:40.000Z',
                },
              ],
            },
          })
          await wrapper.setData({
            currentPage: 2,
            pending: false,
            pageSize: 5,
          })
        })

        it('has eight transactionLinks', () => {
          expect(wrapper.vm.transactionLinks).toHaveLength(8)
        })

        it('loads more transaction links', () => {
          expect(apolloQueryMock).toBeCalledWith({
            query: listTransactionLinks,
            variables: {
              currentPage: 2,
            },
            fetchPolicy: 'network-only',
          })
        })

        describe('close transaction link list', () => {
          beforeEach(async () => {
            wrapper.find('div.row').trigger('click')
          })
          describe('reopen transaction link list', () => {
            beforeEach(async () => {
              jest.clearAllMocks()
              wrapper.find('div.row').trigger('click')
            })

            it('calls the API once', () => {
              expect(apolloQueryMock).toBeCalledTimes(1)
            })

            it('calls the API with current page one', () => {
              expect(apolloQueryMock).toBeCalledWith({
                query: listTransactionLinks,
                variables: {
                  currentPage: 1,
                },
                fetchPolicy: 'network-only',
              })
            })

            it('has four transactionLinks', () => {
              expect(wrapper.vm.transactionLinks).toHaveLength(4)
            })
          })
        })
      })
    })

    describe('reset transaction links', () => {
      beforeEach(async () => {
        jest.clearAllMocks()
        await wrapper.setData({
          currentPage: 0,
          pending: false,
          pageSize: 5,
        })
      })

      it('reloads transaction links', () => {
        expect(apolloQueryMock).toBeCalledWith({
          query: listTransactionLinks,
          variables: {
            currentPage: 1,
          },
          fetchPolicy: 'network-only',
        })
      })

      it('emits update transactions', () => {
        expect(wrapper.emitted('update-transactions')).toBeTruthy()
      })

      it('has four transaction links in list', () => {
        expect(wrapper.vm.transactionLinks).toHaveLength(4)
      })
    })

    describe('loads transaction links with error', () => {
      beforeEach(() => {
        apolloQueryMock.mockRejectedValue({ message: 'OUCH!' })
        wrapper.find('div.row').trigger('click')
      })

      it('toasts an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('OUCH!')
      })
    })
  })
})
