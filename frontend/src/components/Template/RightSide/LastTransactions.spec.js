import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import LastTransactions from './LastTransactions'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    d: (date) => date,
  }),
}))

vi.mock('vue-avatar', () => ({
  default: {
    name: 'Avatar',
    template: '<div class="avatar"></div>',
  },
}))

vi.mock('@/components/TransactionRows/Name', () => ({
  default: {
    name: 'Name',
    template: '<div class="name"></div>',
  },
}))

describe('LastTransactions', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(LastTransactions, {
      props,
      global: {
        stubs: {
          BRow: true,
          BCol: true,
        },
      },
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('renders the component div.rightside-last-transactions', () => {
      expect(wrapper.find('div.rightside-last-transactions').exists()).toBe(true)
    })
  })

  it('renders the correct number of transactions', async () => {
    const transactions = [
      {
        id: 1,
        typeId: 'TRANSFER',
        linkedUser: { firstName: 'John', lastName: 'Doe' },
        amount: 100,
        balanceDate: '2023-01-01',
      },
      {
        id: 2,
        typeId: 'TRANSFER',
        linkedUser: { firstName: 'Jane', lastName: 'Smith' },
        amount: 200,
        balanceDate: '2023-01-02',
      },
    ]
    wrapper = createWrapper({ transactions })
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.mb-4').length).toBe(2)
  })

  it('does not render DECAY, LINK_SUMMARY, or CREATION transactions', async () => {
    const transactions = [
      {
        id: 1,
        typeId: 'TRANSFER',
        linkedUser: { firstName: 'John', lastName: 'Doe' },
        amount: 100,
        balanceDate: '2023-01-01',
      },
      {
        id: 2,
        typeId: 'DECAY',
        linkedUser: { firstName: 'Jane', lastName: 'Smith' },
        amount: 200,
        balanceDate: '2023-01-02',
      },
      {
        id: 3,
        typeId: 'LINK_SUMMARY',
        linkedUser: { firstName: 'Bob', lastName: 'Johnson' },
        amount: 300,
        balanceDate: '2023-01-03',
      },
      {
        id: 4,
        typeId: 'CREATION',
        linkedUser: { firstName: 'Alice', lastName: 'Brown' },
        amount: 400,
        balanceDate: '2023-01-04',
      },
    ]
    wrapper = createWrapper({ transactions })
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.mb-4').length).toBe(1)
  })
})
