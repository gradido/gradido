import { mount } from '@vue/test-utils'
import GdtTransactionList from './GdtTransactionList'

const localVue = global.localVue

const apolloMock = jest.fn().mockResolvedValue({
  data: {
    listGDTEntries: {
      count: 4,
      gdtEntries: [
        {
          amount: 100,
          amount2: 0,
          gdt: 1700,
          factor: 17,
          factor2: 1,
          comment: '',
          coupon_code: '',
          date: '2021-05-02T17:20:11+00:00',
          email: 'bob@example.org',
          gdt_entry_type_id: 1,
        },
        {
          amount: 1810,
          amount2: 0,
          gdt: 362,
          factor: 0.2,
          factor2: 1,
          comment: 'Dezember 20',
          coupon_code: '',
          date: '2020-12-31T12:00:00+00:00',
          email: 'bob@example.org',
          gdt_entry_type_id: 7,
        },
        {
          amount: 100,
          amount2: 0,
          gdt: 1700,
          factor: 17,
          factor2: 1,
          comment: '',
          coupon_code: '',
          date: '2020-05-07T17:00:00+00:00',
          email: 'bob@example.org',
          gdt_entry_type_id: 1,
        },
        {
          amount: 100,
          amount2: 0,
          gdt: 110,
          factor: 22,
          factor2: 0.05,
          comment: '',
          coupon_code: '',
          date: '2020-04-10T13:28:00+00:00',
          email: 'em741@gmx.de',
          gdt_entry_type_id: 4,
        },
      ],
    },
  },
})

const toastErrorMock = jest.fn()

describe('GdtTransactionList', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $n: jest.fn((n) => n),
    $d: jest.fn((d) => d),
    $store: {
      state: {
        sessionId: 1,
      },
    },
    $toasted: {
      error: toastErrorMock,
    },
    $apollo: {
      query: apolloMock,
    },
  }

  const Wrapper = () => {
    return mount(GdtTransactionList, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdt-transaction-list').exists()).toBeTruthy()
    })

    describe('server returns valid data', () => {
      it('calls the API', async () => {
        await wrapper.vm.$nextTick()
        expect(apolloMock).toBeCalledWith(
          expect.objectContaining({
            variables: {
              sessionId: 1,
              currentPage: 1,
              pageSize: 25,
            },
          }),
        )
      })
    })

    describe('server returns error', () => {
      beforeEach(() => {
        jest.resetAllMocks()
        apolloMock.mockRejectedValue({
          message: 'Ouch!',
        })
        wrapper = Wrapper()
      })

      it('toasts an error message', () => {
        expect(toastErrorMock).toBeCalledWith('Ouch!')
      })
    })
  })
})
