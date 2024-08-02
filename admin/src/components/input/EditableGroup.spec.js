import { mount } from '@vue/test-utils'
import EditableGroup from './EditableGroup.vue'
import { vi, describe, it, expect } from 'vitest'

const localVue = global.localVue
const viewValue = 'test label value'
const editValue = 'test edit value'

const mocks = {
  $t: vi.fn((t) => t),
}

describe('EditableGroup', () => {
  let wrapper

  const createWrapper = (propsData) => {
    return mount(EditableGroup, {
      localVue,
      propsData,
      mocks,
      slots: {
        view: `<div>${viewValue}</div>`,
        edit: `<div class='test-edit'>${editValue}</div>`,
      },
    })
  }

  it('renders the view slot when not editing', () => {
    wrapper = createWrapper({ allowEdit: true })

    expect(wrapper.find('div').text()).toBe(viewValue)
  })

  it('renders the edit slot when editing', async () => {
    wrapper = createWrapper({ allowEdit: true })

    await wrapper.find('button').trigger('click')

    expect(wrapper.find('.test-edit').text()).toBe(editValue)
  })

  it('emits save event when clicking save button', async () => {
    wrapper = createWrapper({ allowEdit: true })

    await wrapper.find('button').trigger('click') // Click to enable editing
    await wrapper.vm.$emit('input', 'New Value') // Simulate input change
    await wrapper.setData({ isValueChanged: true }) // Set valueChanged to true
    await wrapper.find('button').trigger('click') // Click to save

    expect(wrapper.emitted().save).toBeTruthy()
  })

  it('disables save button when value is not changed', async () => {
    wrapper = createWrapper({ allowEdit: true })

    await wrapper.find('button').trigger('click') // Click to enable editing

    expect(wrapper.find('button').attributes('disabled')).toBe('disabled')
  })

  it('enables save button when value is changed', async () => {
    wrapper = createWrapper({ allowEdit: true })

    await wrapper.find('button').trigger('click') // Click to enable editing
    await wrapper.vm.$emit('input', 'New Value') // Simulate input change
    await wrapper.setData({ isValueChanged: true }) // Set valueChanged to true

    expect(wrapper.find('button').attributes('disabled')).toBeFalsy()
  })

  it('updates variant to success when editing', async () => {
    wrapper = createWrapper({ allowEdit: true })

    await wrapper.find('button').trigger('click') // Click to enable editing

    expect(wrapper.vm.variant).toBe('success')
  })

  it('updates variant to prime when not editing', async () => {
    wrapper = createWrapper({ allowEdit: true })

    expect(wrapper.vm.variant).toBe('prime')
  })

  it('emits reset event when clicking close button', async () => {
    wrapper = createWrapper({ allowEdit: true })

    await wrapper.find('button').trigger('click') // Click to enable editing
    await wrapper.find('button.close-button').trigger('click') // Click close button

    expect(wrapper.emitted().reset).toBeTruthy()
  })
})
