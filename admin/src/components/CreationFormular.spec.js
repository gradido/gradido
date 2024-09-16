import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import CreationFormular from './CreationFormular.vue'
import { BFormRadioGroup } from 'bootstrap-vue-next'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
  }),
}))

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: vi.fn(),
  }),
  useQuery: () => ({
    refetch: vi.fn(),
  }),
}))

vi.mock('vuex', () => ({
  useStore: () => ({
    commit: vi.fn(),
  }),
}))

vi.mock('../composables/useCreationMonths', () => ({
  default: () => ({
    creationDateObjects: ref([
      { short: 'Jan', year: '2024', date: '2024-01-01' },
      { short: 'Feb', year: '2024', date: '2024-02-01' },
    ]),
  }),
}))

const mockChildComponents = {
  BForm: { template: '<div><slot></slot></div>' },
  BFormRadioGroup,
  BInputGroup: { template: '<div><slot></slot></div>' },
  BFormInput: { template: '<input />', props: ['modelValue'] },
  BFormTextarea: { template: '<textarea></textarea>', props: ['modelValue'] },
  BButton: { template: '<button type="button"></button>' },
}

describe('CreationFormular', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CreationFormular, {
      global: {
        stubs: mockChildComponents,
        mocks: {
          $t: (key) => key,
        },
      },
      props: {
        pagetype: '',
        item: {},
        items: [],
        creationUserData: {},
        creation: [100, 200], // Mock creation data
      },
    })
  })

  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('initializes with default values', () => {
    expect(wrapper.vm.text).toBe('')
    expect(wrapper.vm.value).toBe(0)
    expect(wrapper.vm.selected).toBe(null)
  })

  it('updates radio options based on creationDateObjects', async () => {
    await nextTick()
    expect(wrapper.vm.radioOptions).toHaveLength(2)
    expect(wrapper.vm.radioOptions[0].name).toContain('Jan')
    expect(wrapper.vm.radioOptions[1].name).toContain('Feb')
  })

  it('handles month selection', async () => {
    const radioGroup = wrapper.findComponent({ name: 'BFormRadioGroup' })
    await radioGroup.vm.$emit('update:modelValue', {
      short: 'Jan',
      year: '2024',
      date: '2024-01-01',
      creation: 100,
    })
    expect(wrapper.vm.selected).toEqual({
      short: 'Jan',
      year: '2024',
      date: '2024-01-01',
      creation: 100,
    })
    expect(wrapper.vm.text).toBe('creation_form.creation_for Jan 2024')
  })

  it('disables submit button when form is invalid', async () => {
    wrapper.vm.selected = null
    wrapper.vm.value = 0
    wrapper.vm.text = ''
    await wrapper.vm.$nextTick()
    const submitButton = wrapper.find('.test-submit')
    expect(submitButton.attributes('disabled')).toBeDefined()
  })

  it('enables submit button when form is valid', async () => {
    wrapper.vm.selected = { short: 'Jan', year: '2024', date: '2024-01-01', creation: 100 }
    wrapper.vm.value = 100
    wrapper.vm.text = 'Valid text input'
    await wrapper.vm.$nextTick()
    const submitButton = wrapper.find('.test-submit')
    expect(submitButton.attributes('disabled')).toBeUndefined()
  })

  it('resets form on reset button click', async () => {
    wrapper.vm.selected = { short: 'Jan', year: '2024', date: '2024-01-01', creation: 100 }
    wrapper.vm.value = 100
    wrapper.vm.text = 'Some text'
    await wrapper.vm.$nextTick()
    const resetButton = wrapper.find('button[type="reset"]')
    await resetButton.trigger('click')
    expect(wrapper.vm.selected).toBe(null)
    expect(wrapper.vm.value).toBe(0)
    expect(wrapper.vm.text).toBe('')
  })

  it('displays different button text based on pagetype', async () => {
    await wrapper.setProps({ pagetype: 'PageCreationConfirm' })
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.submitBtnText).toBe('creation_form.update_creation')

    await wrapper.setProps({ pagetype: '' })
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.submitBtnText).toBe('creation_form.submit_creation')
  })
})
