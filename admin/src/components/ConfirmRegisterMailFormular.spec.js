import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import ConfirmRegisterMailFormular from './ConfirmRegisterMailFormular.vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'

vi.mock('@vue/apollo-composable')
vi.mock('vue-i18n')
vi.mock('@/composables/useToast')

describe('ConfirmRegisterMailFormular', () => {
  let wrapper
  const mockMutate = vi.fn()
  const mockRefetch = vi.fn()
  const mockT = vi.fn((key) => key)
  const mockToastSuccess = vi.fn()
  const mockToastError = vi.fn()
  // The tab asks for the member's e-mail status; this is what the server would say for
  // an ordinary, never-changed account.
  const status = ref({
    adminEmailStatus: {
      gdtEmail: 'bob@baumeister.de',
      currentConfirmed: false,
      elopageBuysOnCurrent: false,
      pendingEmail: null,
      pendingSince: null,
    },
  })

  const mountComponent = () =>
    mount(ConfirmRegisterMailFormular, {
      props: {
        checked: false,
        email: 'bob@baumeister.de',
        dateLastSend: '',
        userId: 7,
      },
      global: {
        mocks: {
          $t: mockT,
          $d: () => 'some date',
        },
      },
    })

  beforeEach(() => {
    vi.clearAllMocks()
    status.value = {
      adminEmailStatus: {
        gdtEmail: 'bob@baumeister.de',
        currentConfirmed: false,
        elopageBuysOnCurrent: false,
        pendingEmail: null,
        pendingSince: null,
      },
    }

    useMutation.mockReturnValue({
      mutate: mockMutate,
    })

    useQuery.mockReturnValue({
      result: status,
      refetch: mockRefetch,
    })

    useI18n.mockReturnValue({
      t: mockT,
    })

    useAppToast.mockReturnValue({
      toastSuccess: mockToastSuccess,
      toastError: mockToastError,
    })

    wrapper = mountComponent()
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

  describe('correcting a never-confirmed address', () => {
    it('offers the correction while the address is unconfirmed', () => {
      expect(wrapper.find('[data-test="email-replace"]').exists()).toBe(true)
      expect(
        wrapper.find('[data-test="email-replace-button"]').attributes('disabled'),
      ).toBeDefined()
    })

    it('sends member and corrected address, shows the new one and tells', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { adminReplaceUnconfirmedEmail: 'bob@baumeister.org' },
      })
      await wrapper.find('[data-test="email-replace-input"]').setValue('bob@baumeister.org')
      await wrapper.find('[data-test="email-replace-button"]').trigger('click')
      expect(mockMutate).toHaveBeenCalledWith({ userId: 7, email: 'bob@baumeister.org' })
      expect(wrapper.emitted('email-replaced')[0]).toEqual(['bob@baumeister.org'])
      expect(mockToastSuccess).toHaveBeenCalledWith('unregister_mail.replace.success')
      expect(mockRefetch).toHaveBeenCalled()
    })

    it('warns when the address carries Elopage purchases - a webhook account is no typo', async () => {
      status.value.adminEmailStatus.elopageBuysOnCurrent = true
      wrapper = mountComponent()
      expect(wrapper.find('[data-test="email-replace-warning"]').exists()).toBe(true)
    })

    it('hides the correction once the address is confirmed', () => {
      wrapper = mount(ConfirmRegisterMailFormular, {
        props: { checked: true, email: 'bob@baumeister.de', dateLastSend: '', userId: 7 },
        global: { mocks: { $t: mockT, $d: () => 'some date' } },
      })
      expect(wrapper.find('[data-test="email-replace"]').exists()).toBe(false)
    })
  })

  describe('what the support needs beside the current address', () => {
    it('says nothing while the GDT address is the current one', () => {
      expect(wrapper.find('[data-test="email-gdt"]').exists()).toBe(false)
    })

    it('names the GDT address once the member has changed theirs', () => {
      status.value.adminEmailStatus.gdtEmail = 'bob-first@baumeister.de'
      wrapper = mountComponent()
      expect(wrapper.find('[data-test="email-gdt"]').exists()).toBe(true)
    })

    it('shows a change under way', () => {
      status.value.adminEmailStatus.pendingEmail = 'bob-new@baumeister.de'
      status.value.adminEmailStatus.pendingSince = new Date().toISOString()
      wrapper = mountComponent()
      expect(wrapper.find('[data-test="email-pending"]').exists()).toBe(true)
    })
  })
})
