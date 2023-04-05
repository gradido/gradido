import { mount } from '@vue/test-utils'
import TransactionSend from './TransactionSend'

const localVue = global.localVue

const mocks = {
  $i18n: {
    locale: 'en',
  },
  $t: jest.fn((t) => t),
  $d: jest.fn((d) => d),
}

const propsData = {
  amount: '12.45',
  balance: '31.76',
  previousBalance: '19.31',
  balanceDate: '2022-02-28T13:55:47.000Z',
  decay: {
    decay: '-0.2038314055482643084',
    start: '2022-02-25T07:29:26.000Z',
    end: '2022-02-28T13:55:47.000Z',
    duration: 282381,
    __typename: 'Decay',
  },
  id: 9,
  linkedUser: {
    firstName: 'Bibi',
    lastName: 'Bloxberg',
    __typename: 'User',
  },
  memo: 'sadasd asdasdasdasdadadd da dad aad',
  typeId: 'SEND',
  decayStartBlock: new Date('2021-05-13T17:46:31.000Z'),
  previousBookedBalance: '43.56',
}

describe('TransactionSend', () => {
  let wrapper

  const Wrapper = () => {
    return mount(TransactionSend, { localVue, mocks, propsData })
  }
  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component transaction-slot-send', () => {
      expect(wrapper.find('div.transaction-slot-send').exists()).toBeTruthy()
    })
  })
})
