import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import EditableGroupableLabel from './EditableGroupableLabel.vue'
import { BFormGroup, BFormInput } from 'bootstrap-vue-next'

const value = 'test label value'
const label = 'Test Label'
const idName = 'test-id-name'

describe('EditableGroupableLabel', () => {
  let wrapper

  const createWrapper = (props = {}, parentMethods = {}) => {
    const Parent = {
      template: '<editable-groupable-label v-bind="$props" />',
      components: {
        EditableGroupableLabel,
      },
      props: ['value', 'label', 'idName'],
      methods: {
        onInput: vi.fn(),
        ...parentMethods,
      },
    }
    return mount(Parent, {
      props: {
        value,
        label,
        idName,
        ...props,
      },
      global: {
        stubs: {
          BFormGroup,
          BFormInput,
        },
      },
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  it('renders the component', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('renders BFormGroup with correct props', () => {
    const formGroup = wrapper.findComponent(BFormGroup)
    expect(formGroup.props('label')).toBe(label)
    expect(formGroup.props('labelFor')).toBe(idName)
  })

  it('renders BFormInput with correct props', () => {
    const formInput = wrapper.findComponent({ name: 'BFormInput' })
    expect(formInput.props('id')).toBe(idName)
    expect(formInput.props('modelValue')).toBe(value)
  })

  // it('emits input event with the correct value when input changes', async () => {
  //   const newValue = 'new label value'
  //   const editableGroupableLabel = wrapper.findComponent(EditableGroupableLabel)
  //   const input = editableGroupableLabel.findComponent({ name: 'BFormInput' })
  //
  //   await input.vm.$emit('input', newValue)
  //
  //   await wrapper.vm.$nextTick()
  //
  //   expect(wrapper.vm.onInput).toHaveBeenCalledWith(newValue)
  // })

  it('calls parent.valueChanged when value changes', async () => {
    const valueChangedMock = vi.fn()
    wrapper = createWrapper({}, { valueChanged: valueChangedMock })

    const newValue = 'new label value'
    const input = wrapper.findComponent({ name: 'BFormInput' })
    await input.vm.$emit('input', newValue)

    expect(valueChangedMock).toHaveBeenCalled()
  })

  it('calls parent.invalidValues when value is reverted to original', async () => {
    const invalidValuesMock = vi.fn()
    wrapper = createWrapper({}, { invalidValues: invalidValuesMock })

    const input = wrapper.findComponent({ name: 'BFormInput' })
    await input.vm.$emit('input', 'new label value')
    await input.vm.$emit('input', value)

    expect(invalidValuesMock).toHaveBeenCalled()
  })

  it('does not call parent.valueChanged when value is reverted to original', async () => {
    const valueChangedMock = vi.fn()
    wrapper = createWrapper({}, { valueChanged: valueChangedMock })

    const input = wrapper.findComponent({ name: 'BFormInput' })
    await input.vm.$emit('input', value)

    expect(valueChangedMock).not.toHaveBeenCalled()
  })
})
