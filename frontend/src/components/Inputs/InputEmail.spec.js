import { mount } from '@vue/test-utils'

import InputEmail from './InputEmail'

const localVue = global.localVue

describe('InputEmail', () => {
  let wrapper

  const propsData = {
    name: 'input-field-name',
    label: 'input-field-label',
    placeholder: 'input-field-placeholder',
    value: '',
  }

  const mocks = {
    $route: {
      params: {},
    },
  }

  const Wrapper = () => {
    return mount(InputEmail, { localVue, propsData, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has an input field', () => {
      expect(wrapper.find('input').exists()).toBeTruthy()
    })

    describe('properties', () => {
      it('has the name "input-field-name"', () => {
        expect(wrapper.find('input').attributes('name')).toEqual('input-field-name')
      })

      it('has the id "input-field-name-input-field"', () => {
        expect(wrapper.find('input').attributes('id')).toEqual('input-field-name-input-field')
      })

      it('has the placeholder "input-field-placeholder"', () => {
        expect(wrapper.find('input').attributes('placeholder')).toEqual('input-field-placeholder')
      })

      it('has the value ""', () => {
        expect(wrapper.vm.currentValue).toEqual('')
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
        expect(wrapper.emitted('input')).toEqual([['12']])
      })
    })

    describe('value property changes', () => {
      it('updates data model', async () => {
        await wrapper.setProps({ value: 'user@example.org' })
        expect(wrapper.vm.currentValue).toEqual('user@example.org')
      })
    })
  })
})
