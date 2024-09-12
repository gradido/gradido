import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import TransactionDecay from './TransactionDecay'
import CollapseIcon from '../TransactionRows/CollapseIcon'
import DecayInformationDecay from '../DecayInformations/DecayInformation-Decay'
import { BCol, BCollapse, BRow } from 'bootstrap-vue-next'

vi.mock('../TransactionRows/CollapseIcon', () => ({
  default: {
    name: 'CollapseIcon',
    render: () => null,
  },
}))

vi.mock('../DecayInformations/DecayInformation-Decay', () => ({
  default: {
    name: 'DecayInformationDecay',
    render: () => null,
    props: {
      balance: null,
      decay: null,
      previousBalance: null,
    },
  },
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    d: (date, format) => `Mocked ${format} date for ${date}`,
  }),
}))

const mocks = {
  $t: (key) => key,
  $d: (date) => date,
}

const propsData = {
  amount: '12.45',
  balance: '31.76099091058521',
  decay: {
    decay: '-0.2038314055482643084',
    start: '2022-02-25T07:29:26.000Z',
    end: '2022-02-28T13:55:47.000Z',
    duration: 282381,
    __typename: 'Decay',
  },
}

describe('TransactionDecay', () => {
  let wrapper

  const createWrapper = () => {
    return mount(TransactionDecay, {
      global: {
        mocks,
        stubs: {
          BRow,
          BCol,
          BCollapse,
          VariantIcon: true,
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

  it('renders the component transaction-slot-decay', () => {
    expect(wrapper.find('div.transaction-slot-decay').exists()).toBe(true)
  })

  it('displays the correct decay message', () => {
    expect(wrapper.text()).toContain('decay.decay_since_last_transaction')
  })

  it('has a CollapseIcon component', () => {
    expect(wrapper.findComponent(CollapseIcon).exists()).toBe(true)
  })

  it('has a DecayInformationDecay component', () => {
    expect(wrapper.findComponent(DecayInformationDecay).exists()).toBe(true)
  })

  it('computes previousBalance correctly', () => {
    const expectedPreviousBalance = (
      Number(propsData.balance) - Number(propsData.decay.decay)
    ).toString()
    expect(wrapper.vm.previousBalance).toBe(expectedPreviousBalance)
  })

  it('toggles visibility when clicked', async () => {
    const decaySlot = wrapper.find('.transaction-slot-decay')
    expect(wrapper.vm.visible).toBe(false)
    await decaySlot.trigger('click')
    expect(wrapper.vm.visible).toBe(true)
    await decaySlot.trigger('click')
    expect(wrapper.vm.visible).toBe(false)
  })

  it('passes correct props to DecayInformationDecay', () => {
    const decayInfo = wrapper.findComponent(DecayInformationDecay)
    expect(decayInfo.props('balance')).toBe(propsData.balance)
    expect(decayInfo.props('decay')).toBe(propsData.decay.decay)
    expect(decayInfo.props('previousBalance')).toBe(wrapper.vm.previousBalance)
  })
})
