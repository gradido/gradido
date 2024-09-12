// import { mount } from '@vue/test-utils'
// import TransactionCreation from './TransactionCreation'
//
// const localVue = global.localVue
//
// const mocks = {
//   $i18n: {
//     locale: 'en',
//   },
//   $t: jest.fn((t) => t),
//   $d: jest.fn((d) => d),
// }
//
// const propsData = {
//   amount: '12.45',
//   balance: '31.76',
//   previousBalance: '19.31',
//   balanceDate: '2022-02-28T13:55:47.000Z',
//   decay: {
//     decay: '-0.2038314055482643084',
//     start: '2022-02-25T07:29:26.000Z',
//     end: '2022-02-28T13:55:47.000Z',
//     duration: 282381,
//     __typename: 'CREATION',
//   },
//   id: 9,
//   linkedUser: {
//     firstName: 'Bibi',
//     lastName: 'Bloxberg',
//     __typename: 'User',
//   },
//   memo: 'sadasd asdasdasdasdadadd da dad aad',
//   typeId: 'DECAY',
//   decayStartBlock: new Date('2021-05-13T17:46:31.000Z'),
//   previousBookedBalance: '43.56',
// }
//
// describe('TransactionCreation', () => {
//   let wrapper
//
//   const Wrapper = () => {
//     return mount(TransactionCreation, { localVue, mocks, propsData })
//   }
//   describe('mount', () => {
//     beforeEach(() => {
//       wrapper = Wrapper()
//     })
//
//     it('renders the component transaction-slot-creation', () => {
//       expect(wrapper.find('div.transaction-slot-creation').exists()).toBeTruthy()
//     })
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import TransactionCreation from './TransactionCreation'
import CollapseIcon from '../TransactionRows/CollapseIcon'
import DecayInformation from '../DecayInformations/DecayInformation'
import { BAvatar, BCol, BCollapse, BRow } from 'bootstrap-vue-next'

// Mock child components
vi.mock('../TransactionRows/CollapseIcon', () => ({
  default: {
    name: 'CollapseIcon',
    render: () => null,
  },
}))

vi.mock('../DecayInformations/DecayInformation', () => ({
  default: {
    name: 'DecayInformation',
    render: () => null,
    props: {
      typeId: null,
      decay: null,
      amount: null,
      memo: null,
      balance: null,
      previousBalance: null,
    },
  },
}))

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    d: (date, format) => `Mocked ${format} date for ${date}`,
  }),
}))

const mocks = {
  $t: (key) => key,
  $d: (date, format) => `Mocked ${format} date for ${date}`,
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
    __typename: 'CREATION',
  },
  id: 9,
  linkedUser: {
    firstName: 'Bibi',
    lastName: 'Bloxberg',
    __typename: 'User',
  },
  memo: 'sadasd asdasdasdasdadadd da dad aad',
  typeId: 'DECAY',
  decayStartBlock: new Date('2021-05-13T17:46:31.000Z'),
  previousBookedBalance: '43.56',
}

describe('TransactionCreation', () => {
  let wrapper

  const createWrapper = () => {
    return mount(TransactionCreation, {
      global: {
        mocks,
        stubs: {
          BRow,
          BCol,
          BCollapse,
          BAvatar,
        },
      },
      props: propsData,
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component transaction-slot-creation', () => {
    expect(wrapper.find('div.transaction-slot-creation').exists()).toBe(true)
  })

  it('displays the correct user name', () => {
    const nameElement = wrapper.find('.fw-bold')
    expect(nameElement.text()).toBe('Bibi Bloxberg')
  })

  it('displays the correct date and time', () => {
    const dateElements = wrapper.findAll('.small')
    expect(dateElements[0].text()).toContain('Mocked short date for')
    expect(dateElements[1].text()).toContain('Mocked time date for')
  })

  it('displays the correct amount', () => {
    const amountElement = wrapper.find('.fw-bold:last-child')
    expect(amountElement.text()).toBe('Mocked GDD: 12.45')
  })

  it('displays the correct transaction type', () => {
    const typeElement = wrapper.find('.small.mb-2')
    expect(typeElement.text()).toBe('decay.types.receive')
  })

  it('has a CollapseIcon component', () => {
    expect(wrapper.findComponent(CollapseIcon).exists()).toBe(true)
  })

  it('has a DecayInformation component', () => {
    expect(wrapper.findComponent(DecayInformation).exists()).toBe(true)
  })

  it('toggles visibility when clicked', async () => {
    const creationSlot = wrapper.find('.transaction-slot-creation')
    expect(wrapper.vm.visible).toBe(false)
    await creationSlot.trigger('click')
    expect(wrapper.vm.visible).toBe(true)
    await creationSlot.trigger('click')
    expect(wrapper.vm.visible).toBe(false)
  })

  it('passes correct props to DecayInformation', () => {
    const decayInfo = wrapper.findComponent(DecayInformation)
    expect(decayInfo.props('typeId')).toBe(propsData.typeId)
    expect(decayInfo.props('decay')).toEqual(propsData.decay)
    expect(decayInfo.props('amount')).toBe(propsData.amount)
    expect(decayInfo.props('memo')).toBe(propsData.memo)
    expect(decayInfo.props('balance')).toBe(propsData.balance)
    expect(decayInfo.props('previousBalance')).toBe(propsData.previousBalance)
  })
})
