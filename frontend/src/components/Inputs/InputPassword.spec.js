import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import InputPassword from './InputPassword'
import {
  BButton,
  BFormGroup,
  BFormInput,
  BFormInvalidFeedback,
  BInputGroup,
} from 'bootstrap-vue-next'

// Mock vee-validate
vi.mock('vee-validate', () => ({
  useField: vi.fn(() => ({
    value: '',
    errorMessage: '',
    meta: { valid: true },
    errors: [],
    validate: vi.fn(),
  })),
}))

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

describe('InputPassword', () => {
  let wrapper

  const propsData = {
    name: 'input-field-name',
    label: 'input-field-label',
    placeholder: 'input-field-placeholder',
    modelValue: '',
  }

  const global = {
    components: {
      BFormGroup,
      BInputGroup,
      BFormInput,
      BButton,
      BFormInvalidFeedback,
    },
    stubs: {
      IBiEye: true,
      IBiEyeSlash: true,
    },
    mocks: {
      $t: (key) => key,
    },
  }

  const Wrapper = () => {
    return mount(InputPassword, {
      props: propsData,
      global,
    })
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
        expect(wrapper.find('input').attributes('placeholder')).toEqual('form.password')
      })

      it('has the value ""', () => {
        expect(wrapper.find('input').attributes('value')).toEqual('')
      })

      it('has the label "input-field-label"', () => {
        expect(wrapper.find('label').text()).toEqual('form.password')
      })

      it('has the label for "input-field-name-input-field"', () => {
        expect(wrapper.find('label').attributes('for')).toEqual('input-field-name-input-field')
      })
    })

    describe('input value changes', () => {
      it('emits value with new value', async () => {
        await wrapper.find('input').trigger('input', '12')
        expect(wrapper.emitted('input')).toBeTruthy()
        expect(wrapper.emitted('input')[0][0]['0']).toEqual('1')
        expect(wrapper.emitted('input')[0][0]['1']).toEqual('2')
      })
    })

    describe('password visibility', () => {
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

    describe('password visibility icon', () => {
      it('is by default IBiEyeSlash', () => {
        expect(wrapper.find('i-bi-eye-slash-stub').exists()).toBe(true)
        expect(wrapper.find('i-bi-eye-stub').exists()).toBe(false)
      })

      it('changes to IBiEye when clicked', async () => {
        await wrapper.find('button').trigger('click')
        expect(wrapper.find('i-bi-eye-stub').exists()).toBe(true)
        expect(wrapper.find('i-bi-eye-slash-stub').exists()).toBe(false)
      })

      it('changes back to IBiEyeSlash when clicked twice', async () => {
        await wrapper.find('button').trigger('click')
        await wrapper.find('button').trigger('click')
        expect(wrapper.find('i-bi-eye-slash-stub').exists()).toBe(true)
        expect(wrapper.find('i-bi-eye-stub').exists()).toBe(false)
      })
    })
  })
})
