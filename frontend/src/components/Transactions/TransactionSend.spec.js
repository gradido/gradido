import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import TransactionSend from './TransactionSend'
import CollapseIcon from '../TransactionRows/CollapseIcon'
import Name from '../TransactionRows/Name'
import DecayInformation from '../DecayInformations/DecayInformation'
import { BCol, BCollapse, BRow } from 'bootstrap-vue-next'
import AppAvatar from '@/components/AppAvatar.vue'

vi.mock('app-avatar', () => ({
  default: {
    name: 'AppAvatar',
    render: () => null,
  },
}))

vi.mock('../TransactionRows/CollapseIcon', () => ({
  default: {
    name: 'CollapseIcon',
    render: () => null,
  },
}))

vi.mock('../TransactionRows/Name', () => ({
  default: {
    name: 'Name',
    render: () => null,
  },
}))

vi.mock('../DecayInformations/DecayInformation', () => ({
  default: {
    name: 'DecayInformation',
    render: () => null,
  },
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    d: (date, format) => `Mocked ${format} date for ${date}`,
  }),
}))

const mocks = {
  $filters: {
    GDD: vi.fn((value) => `Mocked GDD: ${value}`),
  },
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

  const createWrapper = () => {
    return mount(TransactionSend, {
      global: {
        mocks: {
          ...mocks,
          $t: (key) => key,
          $d: (date, format) => `Mocked ${format} date for ${date}`,
        },
        components: {
          AppAvatar,
          CollapseIcon,
          Name,
          DecayInformation,
        },
        stubs: {
          BRow,
          BCol,
          BCollapse,
        },
      },
      props: propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('renders the component transaction-slot-send', () => {
      expect(wrapper.find('div.transaction-slot-send').exists()).toBe(true)
    })

    it('displays the correct date and time', () => {
      const dateElements = wrapper.findAll('.small')
      expect(dateElements[0].text()).toContain('Mocked short date for')
      expect(dateElements[1].text()).toContain('Mocked time date for')
    })

    it('displays the correct amount', () => {
      const amountElement = wrapper.find('[data-test="transaction-amount"]')
      expect(amountElement.text()).toBe('Mocked GDD: 12.45')
    })

    it('displays the correct transaction type', () => {
      const typeElement = wrapper.find('.small.mb-2')
      expect(typeElement.text()).toBe('decay.types.send')
    })
  })
})
