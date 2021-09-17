import { mount } from '@vue/test-utils'

import InputPassword from './InputPassword'

const localVue = global.localVue

describe('InputPassword', () => {
  let wrapper

  const propsData = {
    name: 'input-field-name',
    label: 'input-field-label',
    placeholder: 'input-field-placeholder',
    value: '',
  }

  const Wrapper = () => {
    return mount(InputPassword, { localVue, propsData })
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

    describe('password visibilty', () => {
      it('has type password by default', () => {
        expect(wrapper.find('input').attributes('type')).toEqual('password')
      })

      it('changes to type text when icon is clicked', async () => {
        await wrapper.find('button').trigger('click')
        expect(wrapper.find('input').attributes('type')).toEqual('text')
      })

      it('changes back to type password when icon is clicked twice', async () => {
        await wrapper.find('button').trigger('click')
        await wrapper.find('button').trigger('click')
        expect(wrapper.find('input').attributes('type')).toEqual('password')
      })
    })

    describe('password visibilty icon', () => {
      it('is by default bi-eye-slash', () => {
        expect(wrapper.find('svg').classes('bi-eye-slash')).toBe(true)
      })

      it('changes to bi-eye when clicked', async () => {
        await wrapper.find('button').trigger('click')
        expect(wrapper.find('svg').classes('bi-eye')).toBe(true)
      })

      it('changes back to bi-eye-slash when clicked twice', async () => {
        await wrapper.find('button').trigger('click')
        await wrapper.find('button').trigger('click')
        expect(wrapper.find('svg').classes('bi-eye-slash')).toBe(true)
      })
    })
  })
})
