import { mount } from '@vue/test-utils'
import EditableGroupableLabel from './EditableGroupableLabel.vue'

const localVue = global.localVue
const value = 'test label value'
const label = 'Test Label'
const idName = 'test-id-name'

describe('EditableGroupableLabel', () => {
  let wrapper

  const createWrapper = (propsData) => {
    return mount(EditableGroupableLabel, {
      localVue,
      propsData,
    })
  }

  beforeEach(() => {
    wrapper = createWrapper({ value, label, idName })
  })

  it('renders the label correctly', () => {
    expect(wrapper.find('label').text()).toBe(label)
  })

  it('renders the input with the correct id and value', () => {
    const input = wrapper.find('input')
    expect(input.attributes('id')).toBe(idName)
    expect(input.element.value).toBe(value)
  })

  it('emits input event with the correct value when input changes', async () => {
    const newValue = 'new label value'
    const input = wrapper.find('input')
    input.element.value = newValue
    await input.trigger('input')

    expect(wrapper.emitted().input).toBeTruthy()
    expect(wrapper.emitted().input[0][0]).toBe(newValue)
  })

  it('calls valueChanged method on parent when value changes', async () => {
    const valueChangedMock = jest.fn()
    wrapper.vm.$parent = { valueChanged: valueChangedMock }

    const newValue = 'new label value'
    const input = wrapper.find('input')
    input.element.value = newValue
    await input.trigger('input')

    expect(valueChangedMock).toHaveBeenCalled()
  })

  it('calls invalidValues method on parent when value is reverted to original', async () => {
    const invalidValuesMock = jest.fn()
    wrapper.vm.$parent = { invalidValues: invalidValuesMock }

    const input = wrapper.find('input')
    input.element.value = 'new label value'
    await input.trigger('input')

    input.element.value = value
    await input.trigger('input')

    expect(invalidValuesMock).toHaveBeenCalled()
  })

  it('does not call valueChanged method on parent when value is reverted to original', async () => {
    const valueChangedMock = jest.fn()
    wrapper.vm.$parent = { valueChanged: valueChangedMock }

    const input = wrapper.find('input')
    input.element.value = value
    await input.trigger('input')

    expect(valueChangedMock).not.toHaveBeenCalled()
  })
})
