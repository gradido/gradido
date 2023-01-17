import { mount } from '@vue/test-utils'
import InputHour from './InputHour'

const localVue = global.localVue

describe('InputHour', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $i18n: {
      locale: jest.fn(() => 'en'),
    },
    $n: jest.fn((n) => String(n)),
    $route: {
      params: {},
    },
  }

  describe('mount', () => {
    const propsData = {
      rules: {},
      name: 'input-field-name',
      label: 'input-field-label',
      placeholder: 'input-field-placeholder',
      value: 500,
      validMaxTime: 25,
    }

    const Wrapper = () => {
      return mount(InputHour, {
        localVue,
        mocks,
        propsData,
      })
    }

    beforeEach(() => {
      wrapper = Wrapper()
      // await wrapper.setData({ currentValue: 15 })
    })

    it('renders the component input-hour', () => {
      expect(wrapper.find('div.input-hour').exists()).toBe(true)
    })

    it('has an input field', () => {
      expect(wrapper.find('input').exists()).toBeTruthy()
    })

    describe('properties', () => {
      it('has the id "input-field-name-input-field"', () => {
        expect(wrapper.find('input').attributes('id')).toEqual('input-field-name-input-field')
      })

      it('has the placeholder "input-field-placeholder"', () => {
        expect(wrapper.find('input').attributes('placeholder')).toEqual('input-field-placeholder')
      })

      it('has the value 0', () => {
        expect(wrapper.vm.currentValue).toEqual(0)
      })

      it('has the label "input-field-label"', () => {
        expect(wrapper.find('label').text()).toEqual('input-field-label')
      })

      it('has the label for "input-field-name-input-field"', () => {
        expect(wrapper.find('label').attributes('for')).toEqual('input-field-name-input-field')
      })
    })

    describe('input value changes', () => {
      it('emits input with new value', async () => {
        await wrapper.find('input').setValue('12')
        expect(wrapper.emitted('input')).toBeTruthy()
        expect(wrapper.emitted('input')).toEqual([[12]])
      })
    })

    describe('value property changes', () => {
      it('updates data model', async () => {
        await wrapper.setProps({ value: 15 })
        expect(wrapper.vm.currentValue).toEqual(15)
      })
    })
  })
})
