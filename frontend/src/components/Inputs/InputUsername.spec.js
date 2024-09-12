import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import InputUsername from './InputUsername'
import {
  BButton,
  BFormGroup,
  BFormInput,
  BFormInvalidFeedback,
  BInputGroup,
} from 'bootstrap-vue-next'
import { useField } from 'vee-validate'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

vi.mock('vee-validate', () => ({
  useField: vi.fn(() => ({
    meta: { valid: true },
    errors: [],
    value: '',
    errorMessage: '',
  })),
  useForm: vi.fn(),
}))

describe('InputUsername', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(InputUsername, {
      props: {
        modelValue: '',
        unique: false,
        ...props,
      },
      global: {
        mocks: {
          $t: (key) => key,
        },
        components: {
          BFormGroup,
          BInputGroup,
          BFormInput,
          BButton,
          BFormInvalidFeedback,
        },
      },
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  it('renders the component', () => {
    expect(wrapper.find('[data-test="username"]').exists()).toBe(true)
  })

  it('displays the correct label', () => {
    const formGroup = wrapper.findComponent({ name: 'BFormGroup' })
    expect(formGroup.props('label')).toBe('form.username')
  })

  it('displays the correct placeholder', () => {
    const input = wrapper.findComponent({ name: 'BFormInput' })
    expect(input.props('placeholder')).toBe('Username')
  })

  it('emits set-is-edit event when button is clicked', async () => {
    const button = wrapper.findComponent({ name: 'BButton' })
    await button.trigger('click')
    expect(wrapper.emitted('set-is-edit')).toBeTruthy()
  })

  it('shows all errors when showAllErrors prop is true', async () => {
    const errors = ['Error 1', 'Error 2']
    vi.mocked(useField).mockReturnValue({
      meta: { valid: false },
      errors,
      value: '',
      errorMessage: 'Error',
    })

    wrapper = createWrapper({ showAllErrors: true })
    await wrapper.vm.$nextTick()

    const feedback = wrapper.findComponent({ name: 'BFormInvalidFeedback' })
    expect(feedback.exists()).toBe(true)
    expect(feedback.text()).toContain('Error 1')
    expect(feedback.text()).toContain('Error 2')
  })

  it('shows only the first error when showAllErrors prop is false', async () => {
    const errors = ['Error 1', 'Error 2']
    vi.mocked(useField).mockReturnValue({
      meta: { valid: false },
      errors,
      value: '',
      errorMessage: 'Error',
    })

    wrapper = createWrapper({ showAllErrors: false })
    await wrapper.vm.$nextTick()

    const feedback = wrapper.findComponent({ name: 'BFormInvalidFeedback' })
    expect(feedback.exists()).toBe(true)
    expect(feedback.text()).toContain('Error 1')
    expect(feedback.text()).not.toContain('Error 2')
  })
})
