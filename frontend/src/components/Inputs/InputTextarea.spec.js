import { mount } from '@vue/test-utils'
import InputTextarea from './InputTextarea'

const localVue = global.localVue

describe('InputTextarea', () => {
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
      value: 'Long enough',
    }

    const Wrapper = () => {
      return mount(InputTextarea, {
        localVue,
        mocks,
        propsData,
      })
    }

    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component InputTextarea', () => {
      expect(wrapper.findComponent({ name: 'InputTextarea' }).exists()).toBe(true)
    })

    it('has an textarea field', () => {
      expect(wrapper.find('textarea').exists()).toBeTruthy()
    })

    describe('properties', () => {
      it('has the id "input-field-name-input-field"', () => {
        expect(wrapper.find('textarea').attributes('id')).toEqual('input-field-name-input-field')
      })

      it('has the placeholder "input-field-placeholder"', () => {
        expect(wrapper.find('textarea').attributes('placeholder')).toEqual(
          'input-field-placeholder',
        )
      })

      it('has the value ""', () => {
        expect(wrapper.vm.currentValue).toEqual('Long enough')
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
        await wrapper.find('textarea').setValue('New Text')
        expect(wrapper.emitted('input')).toEqual([['New Text']])
      })
    })

    describe('value property changes', () => {
      it('updates data model', async () => {
        await wrapper.setProps({ value: 'new text message' })
        expect(wrapper.vm.currentValue).toEqual('new text message')
      })
    })
  })
})
