import { mount } from '@vue/test-utils'
import { BButton, BFormGroup } from 'bootstrap-vue-next'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, inject } from 'vue'
import { EditableGroup } from './EditableGroup'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key) => key }),
}))

const viewValue = 'test label value'
const editValue = 'test edit value'

// What an input in the edit slot does when its value changes (EditableGroupableLabel): it
// tells the group through what the group provides.
const EditInput = defineComponent({
  setup() {
    const editableGroup = inject('editableGroup')
    return () =>
      h('div', { class: 'test-edit', onClick: () => editableGroup.valueChanged() }, editValue)
  },
})

describe('EditableGroup', () => {
  const createWrapper = (props = {}, slots = {}) => {
    return mount(EditableGroup, {
      props,
      global: {
        stubs: {
          BFormGroup,
          BButton,
          IBiPencilFill: true,
        },
      },
      slots: {
        view: `<div>${viewValue}</div>`,
        edit: EditInput,
        ...slots,
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

  it('shows no buttons when editing is not allowed', () => {
    const wrapper = createWrapper({ allowEdit: false })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('emits save event when clicking save button', async () => {
    const wrapper = createWrapper({ allowEdit: true })
    await wrapper.find('button').trigger('click')
    await wrapper.find('.test-edit').trigger('click')
    await wrapper.find('.save-button').trigger('click')
    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.text()).toContain(viewValue)
  })

  it('disables save button when value is not changed', async () => {
    const wrapper = createWrapper({ allowEdit: true })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('.save-button').attributes('disabled')).toBeDefined()
  })

  it('enables save button when value is changed', async () => {
    const wrapper = createWrapper({ allowEdit: true })
    await wrapper.find('button').trigger('click')
    await wrapper.find('.test-edit').trigger('click')
    expect(wrapper.find('.save-button').attributes('disabled')).toBeUndefined()
  })

  it('takes a change back when the input reports the value it started with', async () => {
    const UndoInput = defineComponent({
      setup() {
        const editableGroup = inject('editableGroup')
        return () =>
          h('div', [
            h('div', { class: 'test-edit', onClick: () => editableGroup.valueChanged() }),
            h('div', { class: 'test-undo', onClick: () => editableGroup.invalidValues() }),
          ])
      },
    })
    const wrapper = createWrapper({ allowEdit: true }, { edit: UndoInput })
    await wrapper.find('button').trigger('click')
    await wrapper.find('.test-edit').trigger('click')
    await wrapper.find('.test-undo').trigger('click')
    expect(wrapper.find('.save-button').attributes('disabled')).toBeDefined()
  })

  it('hands the slots whether it is editing, and the edit slot a way to report a change', async () => {
    const wrapper = createWrapper(
      { allowEdit: true },
      {
        view: (props) => h('div', { class: 'test-view' }, String(props.isEditing)),
        edit: (props) =>
          h(
            'div',
            { class: 'test-edit', onClick: props['onUpdate:modelValue'] },
            String(props.isEditing),
          ),
      },
    )
    expect(wrapper.find('.test-view').text()).toBe('false')
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('.test-edit').text()).toBe('true')
    await wrapper.find('.test-edit').trigger('click')
    expect(wrapper.find('.save-button').attributes('disabled')).toBeUndefined()
  })

  it('shows the save button as success while editing', async () => {
    const wrapper = createWrapper({ allowEdit: true })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('.save-button').classes()).toContain('btn-success')
  })

  it("shows the edit button with the variant 'prime' when not editing", () => {
    const wrapper = createWrapper({ allowEdit: true })
    expect(wrapper.find('button').classes()).toContain('btn-prime')
  })

  it('emits reset event when clicking close button', async () => {
    const wrapper = createWrapper({ allowEdit: true })
    await wrapper.find('button').trigger('click')
    await wrapper.find('.close-button').trigger('click')
    expect(wrapper.emitted('reset')).toBeTruthy()
    expect(wrapper.text()).toContain(viewValue)
  })
})
