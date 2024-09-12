import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import Send from './Send.vue'
import { useMutation } from '@vue/apollo-composable'
import { sendCoins, createTransactionLink } from '@/graphql/mutations.js'
import { SEND_TYPES } from '@/utils/sendTypes'

// Mock child components
vi.mock('@/components/GddSend/TransactionForm', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('@/components/GddSend/TransactionConfirmationSend', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('@/components/GddSend/TransactionConfirmationLink', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('@/components/GddSend/TransactionResultSendSuccess', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('@/components/GddSend/TransactionResultSendError', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('@/components/GddSend/TransactionResultLink', () => ({
  default: { template: '<div></div>' },
}))

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

// Mock apollo-composable
vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(),
}))

// Mock useAppToast
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: vi.fn(),
  })),
}))

describe('Send', () => {
  let wrapper
  let sendCoinsMock
  let createTransactionLinkMock

  beforeEach(() => {
    sendCoinsMock = vi.fn().mockResolvedValue({})
    createTransactionLinkMock = vi.fn().mockResolvedValue({
      data: {
        createTransactionLink: {
          link: 'http://example.com/link',
          amount: 75,
          memo: 'Test link',
          validUntil: '2023-12-31',
        },
      },
    })

    vi.mocked(useMutation).mockImplementation((mutation) => {
      if (mutation === sendCoins) {
        return { mutate: sendCoinsMock }
      } else if (mutation === createTransactionLink) {
        return { mutate: createTransactionLinkMock }
      }
      return { mutate: vi.fn() }
    })

    wrapper = shallowMount(Send, {
      props: {
        balance: 1000,
        GdtBalance: 500,
        transactions: [],
        pending: false,
      },
      global: {
        stubs: {
          'gdd-send': true,
        },
      },
    })
  })

  it('initializes with correct default values', () => {
    expect(wrapper.vm.transactionData).toEqual({
      identifier: '',
      amount: 0,
      memo: '',
    })
    expect(wrapper.vm.currentTransactionStep).toBe('transactionForm')
  })

  it('sets transaction data correctly', async () => {
    const testData = {
      identifier: 'test@example.com',
      amount: 100,
      memo: 'Test transaction',
      selected: 'send',
    }
    await wrapper.vm.setTransaction(testData)
    expect(wrapper.vm.transactionData).toEqual(testData)
    expect(wrapper.vm.currentTransactionStep).toBe('transactionConfirmationSend')
  })

  it('handles send transaction', async () => {
    await wrapper.vm.setTransaction({
      selected: 'send',
      targetCommunity: { uuid: 'community-uuid' },
      identifier: 'recipient@example.com',
      amount: 50,
      memo: 'Test send',
    })

    await wrapper.vm.sendTransaction()

    expect(sendCoinsMock).toHaveBeenCalledWith({
      recipientCommunityIdentifier: 'community-uuid',
      recipientIdentifier: 'recipient@example.com',
      amount: 50,
      memo: 'Test send',
    })
    expect(wrapper.vm.currentTransactionStep).toBe('transactionResultSendSuccess')
  })

  it('handles create transaction link', async () => {
    wrapper.vm.setTransaction({
      selected: 'link',
      amount: 75,
      memo: 'Test link',
    })

    await wrapper.vm.sendTransaction()

    expect(createTransactionLinkMock).toHaveBeenCalledWith({
      amount: 75,
      memo: 'Test link',
    })
    expect(wrapper.vm.currentTransactionStep).toBe('transactionResultLink')
    expect(wrapper.vm.link).toBe('http://example.com/link')
  })

  it('handles back action', async () => {
    wrapper.vm.currentTransactionStep = 'transactionConfirmationSend'
    await wrapper.vm.onBack()
    expect(wrapper.vm.currentTransactionStep).toBe('transactionForm')
  })

  it('emits update-transactions event', async () => {
    await wrapper.vm.updateTransactions({})
    expect(wrapper.emitted('update-transactions')).toBeTruthy()
    expect(wrapper.emitted('update-transactions')[0]).toEqual([{}])
  })

  it('handles send transaction error', async () => {
    const errorMessage = 'Send failed'
    sendCoinsMock.mockRejectedValue(new Error(errorMessage))

    await wrapper.vm.setTransaction({
      selected: SEND_TYPES.send,
      targetCommunity: { uuid: 'community-uuid' },
      identifier: 'recipient@example.com',
      amount: 50,
      memo: 'Test send',
    })

    await wrapper.vm.sendTransaction()

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.error).toBe(true)
    expect(wrapper.vm.errorResult).toBe(errorMessage)
    expect(wrapper.vm.currentTransactionStep).toBe('transactionResultSendError')
  })
})
