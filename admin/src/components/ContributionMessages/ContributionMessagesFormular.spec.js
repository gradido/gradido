import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import ContributionMessagesFormular from './ContributionMessagesFormular'
import { BButton, BForm } from 'bootstrap-vue-next'

const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastError: mockToastError,
    toastSuccess: vi.fn(),
  }),
}))

const mockMutate = vi.fn().mockResolvedValue({})
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: mockMutate,
  }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

const mockChildComponents = {
  BForm,
  BFormGroup: { template: '<div><slot /></div>' },
  BFormCheckbox: { template: '<div></div>' },
  BFormInput: { template: '<input />' },
  BTabs: { template: '<div><slot /></div>' },
  BTab: { template: '<div><slot /></div>' },
  BTooltip: { template: '<div></div>' },
  BFormTextarea: { template: '<textarea></textarea>' },
  BRow: { template: '<div><slot /></div>' },
  BCol: { template: '<div><slot /></div>' },
  BButton,
  TimePicker: { template: '<div></div>' },
}

describe('ContributionMessagesFormular', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(ContributionMessagesFormular, {
      global: {
        components: mockChildComponents,
        mocks: {
          $route: {
            params: { id: '1' },
          },
        },
      },
      props: {
        contributionId: 42,
        contributionMemo: 'It is a test memo',
        hideResubmission: true,
        ...props,
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component', () => {
    wrapper = createWrapper()
    expect(wrapper.find('.contribution-messages-formular').exists()).toBe(true)
  })

  it('resets form on reset event', async () => {
    wrapper = createWrapper()
    wrapper.vm.form.text = 'text form message'
    wrapper.vm.form.memo = 'changed memo'

    await wrapper.find('form').trigger('reset')
    await nextTick()
    expect(wrapper.vm.form).toEqual({
      text: '',
      memo: 'It is a test memo',
    })
  })

  it('submits form and emits events', async () => {
    wrapper = createWrapper()
    wrapper.vm.form.text = 'text form message'

    await wrapper.find('form').trigger('submit')
    await nextTick()
    expect(wrapper.emitted('get-list-contribution-messages')).toBeTruthy()
    expect(wrapper.emitted('get-list-contribution-messages')[0]).toEqual([42])
    expect(wrapper.emitted('update-status')).toBeTruthy()
    expect(wrapper.emitted('update-status')[0]).toEqual([42])
  })

  it('sends DIALOG contribution message', async () => {
    wrapper = createWrapper()
    wrapper.vm.form.text = 'text form message'
    const onSubmitSpy = vi.spyOn(wrapper.vm, 'onSubmit')

    await wrapper.vm.$nextTick()

    await wrapper.find('button[type="submit"]').trigger('click')
    expect(onSubmitSpy).toHaveBeenCalled()
  })

  it('sends MODERATOR contribution message', async () => {
    wrapper = createWrapper()
    const onSubmitSpy = vi.spyOn(wrapper.vm, 'onSubmit')

    wrapper.vm.form.text = 'text form message'
    wrapper.vm.tabindex = 1
    await wrapper.vm.$nextTick()

    await wrapper.find('button[type="submit"]').trigger('click')
    expect(onSubmitSpy).toHaveBeenCalled()
  })

  it('sends resubmission contribution message', async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    wrapper = createWrapper()
    const onSubmitSpy = vi.spyOn(wrapper.vm, 'onSubmit')
    wrapper.vm.form.text = 'text form message'
    wrapper.vm.showResubmissionDate = true
    wrapper.vm.resubmissionDate = futureDate
    wrapper.vm.resubmissionTime = '08:46'

    await wrapper.vm.$nextTick()

    await wrapper.find('button[type="submit"]').trigger('click')
    expect(onSubmitSpy).toHaveBeenCalled()
  })

  it('updates contribution memo', async () => {
    wrapper = createWrapper()
    const onSubmitSpy = vi.spyOn(wrapper.vm, 'onSubmit')

    wrapper.vm.form.memo = 'changed memo'
    wrapper.vm.tabindex = 2

    await wrapper.vm.$nextTick()

    await wrapper.find('button[type="submit"]').trigger('click')
    await nextTick()
    expect(onSubmitSpy).toHaveBeenCalled()
  })

  it('handles error when sending contribution message', async () => {
    const mockError = new Error('OUCH!')
    wrapper = createWrapper()

    mockMutate.mockRejectedValue(mockError)
    await wrapper.find('form').trigger('submit')
    await nextTick()

    expect(mockToastError).toHaveBeenCalledWith('OUCH!')
  })
})
