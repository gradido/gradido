import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import EditCreationFormular from './EditCreationFormular.vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import useCreationMonths from '@/composables/useCreationMonths'
import {
  BButton,
  BCol,
  BForm,
  BFormInput,
  BFormRadioGroup,
  BFormTextarea,
  BInputGroup,
  BRow,
} from 'bootstrap-vue-next'
import { nextTick } from 'vue'

vi.mock('@vue/apollo-composable')
vi.mock('vue-i18n')
vi.mock('@/composables/useToast')
vi.mock('@/composables/useCreationMonths')

describe('EditCreationFormular', () => {
  let wrapper
  let mockMutate
  let mockOnDone
  let mockOnError
  const mockRefetch = vi.fn()
  const mockT = vi.fn((key) => key)
  const mockD = vi.fn((date) => new Date(date).toISOString().split('T')[0])
  const mockToastSuccess = vi.fn()
  const mockToastError = vi.fn()
  const mockCreationMonths = {
    radioOptions: vi.fn(() => [
      { item: { short: 'Jan', date: '2023-01-01' }, name: 'January' },
      { item: { short: 'Feb', date: '2023-02-01' }, name: 'February' },
      { item: { short: 'Mar', date: '2023-03-01' }, name: 'March' },
    ]),
    creation: { value: [1000, 1000, 1000] },
  }

  beforeEach(() => {
    mockMutate = vi.fn()
    mockOnDone = vi.fn()
    mockOnError = vi.fn()
    useMutation.mockReturnValue({
      mutate: mockMutate,
      onDone: mockOnDone,
      onError: mockOnError,
    })
    useQuery.mockReturnValue({ refetch: mockRefetch })
    useI18n.mockReturnValue({ t: mockT, d: mockD })
    useAppToast.mockReturnValue({ toastSuccess: mockToastSuccess, toastError: mockToastError })
    useCreationMonths.mockReturnValue(mockCreationMonths)

    wrapper = mount(EditCreationFormular, {
      props: {
        item: {
          id: 1,
          contributionDate: '2023-02-15',
          amount: '300',
          email: 'test@example.com',
        },
        creationUserData: {
          id: 1,
          memo: 'Initial memo',
          amount: 200,
        },
      },
      global: {
        stubs: {
          BForm,
          BRow,
          BCol,
          BButton,
          BFormRadioGroup,
          BInputGroup,
          BFormInput,
          BFormTextarea,
        },
      },
    })
  })

  it('renders the component', () => {
    expect(wrapper.find('.component-edit-creation-formular').exists()).toBe(true)
  })

  it('initializes form with correct values', () => {
    expect(wrapper.vm.text).toBe('Initial memo')
    expect(wrapper.vm.value).toBe(200)
    expect(wrapper.vm.selected).toEqual({ short: 'Feb', date: '2023-02-01' })
  })

  it('computes rangeMax correctly', () => {
    expect(wrapper.vm.rangeMax).toBe(1300) // 1000 + 300
  })

  it('disables submit button when form is invalid', async () => {
    wrapper.vm.text = 'memo'
    const submitButton = wrapper.find('.test-submit')
    await nextTick()
    expect(submitButton.attributes('disabled')).toBeDefined()
  })

  it('enables submit button when form is valid', async () => {
    wrapper.vm.text = 'Valid long text'
    wrapper.vm.value = 100
    const submitButton = wrapper.find('.test-submit')
    await nextTick()
    expect(submitButton.attributes('disabled')).toBeUndefined()
  })

  it('calls mutation on form submit', async () => {
    wrapper.vm.text = 'New memo valid'
    wrapper.vm.value = 250
    await wrapper.find('.test-submit').trigger('click')

    expect(mockMutate).toHaveBeenCalledWith({
      id: 1,
      creationDate: '2023-02-01',
      amount: 250,
      memo: 'New memo valid',
    })
  })

  it('handles successful mutation', async () => {
    wrapper.vm.text = 'New memo valid'
    wrapper.vm.value = 250
    await wrapper.find('.test-submit').trigger('click')

    // Simulate successful mutation
    const onDoneCallback = mockOnDone.mock.calls[0][0]
    onDoneCallback()

    expect(wrapper.emitted('update-creation-data')).toBeTruthy()
    expect(mockToastSuccess).toHaveBeenCalledWith('creation_form.toasted_update')
    expect(mockRefetch).toHaveBeenCalled()
    expect(wrapper.vm.value).toBe(0) // Check if form was reset
  })

  it('handles failed mutation', async () => {
    wrapper.vm.text = 'New memo valid'
    wrapper.vm.value = 250
    await wrapper.find('.test-submit').trigger('click')

    // Simulate failed mutation
    const onErrorCallback = mockOnError.mock.calls[0][0]
    onErrorCallback({ message: 'API Error' })

    expect(mockToastError).toHaveBeenCalledWith('API Error')
    expect(wrapper.vm.value).toBe(0) // Check if form was reset
  })
})
