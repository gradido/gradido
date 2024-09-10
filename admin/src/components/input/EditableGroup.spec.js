import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import EditableGroup from './EditableGroup.vue'
import { BButton, BFormGroup } from 'bootstrap-vue-next'

const viewValue = 'test label value'
const editValue = 'test edit value'

describe('EditableGroup', () => {
  const createWrapper = (props = {}) => {
    return mount(EditableGroup, {
      props,
      global: {
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          BFormGroup,
          BButton,
          IBiPencilFill: true,
        },
      },
      slots: {
        view: `<div>${viewValue}</div>`,
        edit: `<div class='test-edit'>${editValue}</div>`,
      },
    })
  }

  it('renders the view slot when not editing', () => {
    const wrapper = createWrapper({ allowEdit: true })
    expect(wrapper.text()).toContain(viewValue)
  })

  it('renders the edit slot when editing', async () => {
    const wrapper = createWrapper({ allowEdit: true })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('.test-edit').text()).toBe(editValue)
  })

  it('emits save event when clicking save button', async () => {
    const wrapper = createWrapper({ allowEdit: true })
    await wrapper.find('button').trigger('click')
    await wrapper.vm.valueChanged()
    await wrapper.find('.save-button').trigger('click')
    expect(wrapper.emitted('save')).toBeTruthy()
  })

  it('disables save button when value is not changed', async () => {
    const wrapper = createWrapper({ allowEdit: true })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('.save-button').attributes('disabled')).toBeDefined()
  })

  it('enables save button when value is changed', async () => {
    const wrapper = createWrapper({ allowEdit: true })
    await wrapper.find('button').trigger('click')
    await wrapper.vm.valueChanged()
    expect(wrapper.find('.save-button').attributes('disabled')).toBeFalsy()
  })

  it('updates variant to success when editing', async () => {
    const wrapper = createWrapper({ allowEdit: true })
    await wrapper.find('button').trigger('click')
    expect(wrapper.vm.variant).toBe('success')
  })

  it('updates variant to prime when not editing', () => {
    const wrapper = createWrapper({ allowEdit: true })
    expect(wrapper.vm.variant).toBe('prime')
  })

  it('emits reset event when clicking close button', async () => {
    const wrapper = createWrapper({ allowEdit: true })
    await wrapper.find('button').trigger('click')
    await wrapper.find('.close-button').trigger('click')
    expect(wrapper.emitted('reset')).toBeTruthy()
  })
})
