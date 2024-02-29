// Test written by ChatGPT 3.5
import { mount } from '@vue/test-utils'
import EditableLabel from './EditableLabel.vue'

const localVue = global.localVue
const value = 'test label value'

describe('EditableLabel', () => {
  let wrapper

  const createWrapper = (propsData) => {
    return mount(EditableLabel, {
      localVue,
      propsData,
    })
  }

  it('renders the label when not editing', () => {
    wrapper = createWrapper({ value, allowEdit: true })

    expect(wrapper.find('label').text()).toBe(value)
  })

  it('renders the input when editing', async () => {
    wrapper = createWrapper({ value, allowEdit: true })

    await wrapper.find('button').trigger('click')

    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('emits save event when clicking save button', async () => {
    wrapper = createWrapper({ value, allowEdit: true })

    await wrapper.find('button').trigger('click')
    await wrapper.setData({ inputValue: 'New Value' })
    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted().save).toBeTruthy()
    expect(wrapper.emitted().save[0][0]).toBe('New Value')
  })

  it('disables save button when value is not changed', async () => {
    wrapper = createWrapper({ value, allowEdit: true })

    await wrapper.find('button').trigger('click')

    expect(wrapper.find('button').attributes('disabled')).toBe('disabled')
  })

  it('enables save button when value is changed', async () => {
    wrapper = createWrapper({ value, allowEdit: true })

    await wrapper.find('button').trigger('click')
    await wrapper.setData({ inputValue: 'New Value' })

    expect(wrapper.find('button').attributes('disabled')).toBeFalsy()
  })

  it('updates originalValue when saving changes', async () => {
    wrapper = createWrapper({ value, allowEdit: true })

    await wrapper.find('button').trigger('click')
    await wrapper.setData({ inputValue: 'New Value' })
    await wrapper.find('button').trigger('click')

    expect(wrapper.vm.originalValue).toBe('New Value')
  })

  it('changes variant to success when editing', async () => {
    wrapper = createWrapper({ value, allowEdit: true })

    await wrapper.find('button').trigger('click')

    expect(wrapper.vm.variant).toBe('success')
  })

  it('changes variant to prime when not editing', async () => {
    wrapper = createWrapper({ value, allowEdit: true })

    expect(wrapper.vm.variant).toBe('prime')
  })
})
