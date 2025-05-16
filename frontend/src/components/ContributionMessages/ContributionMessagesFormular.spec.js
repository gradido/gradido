import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import ContributionMessagesFormular from './ContributionMessagesFormular.vue'
import { nextTick } from 'vue'
import { BButton, BCol, BForm, BFormTextarea, BRow } from 'bootstrap-vue-next'

// Mocks
const mockMutate = vi.fn()
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

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastSuccess: mockToastSuccess,
    toastError: mockToastError,
  }),
}))

describe('ContributionMessagesFormular', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(ContributionMessagesFormular, {
      props: {
        contributionId: 42,
        ...props,
      },
      global: {
        components: {
          BForm,
          BFormTextarea,
          BRow,
          BCol,
          BButton,
        },
        mocks: {
          $t: (msg) => msg,
        },
      },
    })
  }

  beforeEach(() => {
    mockMutate.mockResolvedValue({ data: { createContributionMessage: {} } })
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component', () => {
    expect(wrapper.find('.contribution-messages-formular').exists()).toBe(true)
  })

  it('resets the form on reset event', async () => {
    await wrapper.find('form').trigger('reset')
    expect(wrapper.vm.formText).toBe('')
  })

  describe('form submission', () => {
    beforeEach(async () => {
      await wrapper.find('textarea#textarea').setValue('test message')
      await wrapper.find('form').trigger('submit')
    })

    it('calls the mutation', () => {
      expect(mockMutate).toHaveBeenCalledWith({
        contributionId: 42,
        message: 'test message',
      })
    })

    it('emits add-contribution-message event', async () => {
      await nextTick()
      expect(wrapper.emitted('add-contribution-message')).toEqual([[{}]])
    })

    it('resets the form text', async () => {
      await nextTick()
      expect(wrapper.vm.formText).toBe('')
    })

    it('shows success toast', async () => {
      await nextTick()
      expect(mockToastSuccess).toHaveBeenCalledWith('message.reply')
    })
  })

  describe('form submission with error', () => {
    beforeEach(async () => {
      mockMutate.mockRejectedValue(new Error('OUCH!'))
      await wrapper.find('textarea#textarea').setValue('test message')
      await wrapper.find('form').trigger('submit')
    })

    it('shows error toast', async () => {
      await nextTick()
      expect(mockToastError).toHaveBeenCalledWith('OUCH!')
    })
  })

  it('disables submit button when form is empty', async () => {
    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('diabled')).toBeUndefined()
  })

  it('enables submit button when form has text', async () => {
    await wrapper.find('textarea#textarea').setValue('test message')
    await nextTick()
    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeUndefined()
  })
})
