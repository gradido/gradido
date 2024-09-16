import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ConfirmRegisterMailFormular from './ConfirmRegisterMailFormular.vue'
import { useMutation } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'

vi.mock('@vue/apollo-composable')
vi.mock('vue-i18n')
vi.mock('@/composables/useToast')

describe('ConfirmRegisterMailFormular', () => {
  let wrapper
  const mockMutate = vi.fn()
  const mockT = vi.fn((key) => key)
  const mockToastSuccess = vi.fn()
  const mockToastError = vi.fn()

  beforeEach(() => {
    useMutation.mockReturnValue({
      mutate: mockMutate,
    })

    useI18n.mockReturnValue({
      t: mockT,
    })

    useAppToast.mockReturnValue({
      toastSuccess: mockToastSuccess,
      toastError: mockToastError,
    })

    wrapper = mount(ConfirmRegisterMailFormular, {
      props: {
        checked: false,
        email: 'bob@baumeister.de',
        dateLastSend: '',
      },
      global: {
        mocks: {
          $t: mockT,
        },
      },
    })
  })

  it('renders the component', () => {
    expect(wrapper.find('.component-confirm-register-mail').exists()).toBe(true)
  })

  describe('send register mail', () => {
    it('calls the API with email on button click', async () => {
      mockMutate.mockResolvedValueOnce({})
      await wrapper.find('button.test-button').trigger('click')
      expect(mockMutate).toHaveBeenCalledWith({
        email: 'bob@baumeister.de',
      })
    })

    it('shows success message on successful API call', async () => {
      mockMutate.mockResolvedValueOnce({})
      await wrapper.find('button.test-button').trigger('click')
      expect(mockToastSuccess).toHaveBeenCalledWith('unregister_mail.success')
    })

    it('shows error message on failed API call', async () => {
      mockMutate.mockRejectedValueOnce(new Error('OUCH!'))
      await wrapper.find('button.test-button').trigger('click')
      expect(mockToastError).toHaveBeenCalledWith('unregister_mail.error')
    })
  })
})
