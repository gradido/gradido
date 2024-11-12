import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import InputEmail from './InputEmail'
import { nextTick, ref } from 'vue'
import { BFormGroup, BFormInput, BFormInvalidFeedback } from 'bootstrap-vue-next'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

vi.mock('vee-validate', () => ({
  useField: () => ({
    value: ref(''),
    errorMessage: ref(''),
    validate: vi.fn(),
    meta: { valid: true },
  }),
}))

describe('InputEmail', () => {
  let wrapper

  const propsData = {
    name: 'input-field-name',
    label: 'input-field-label',
    placeholder: 'input-field-placeholder',
  }

  const global = {
    components: {
      BFormGroup,
      BFormInput,
      BFormInvalidFeedback,
    },
    mocks: {
      $route: {
        path: '/',
      },
    },
  }

  const createWrapper = () => {
    return mount(InputEmail, { props: propsData, global })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('has an input field', () => {
      expect(wrapper.find('input').exists()).toBe(true)
    })

    describe('properties', () => {
      it('has the name "input-field-name"', () => {
        expect(wrapper.find('input').attributes('name')).toBe('input-field-name')
      })

      it('has the id "input-field-name-input-field"', () => {
        expect(wrapper.find('input').attributes('id')).toBe('input-field-name-input-field')
      })

      it('has the placeholder "input-field-placeholder"', () => {
        expect(wrapper.find('input').attributes('placeholder')).toBe('form.email')
      })

      it('has the label "input-field-label"', () => {
        expect(wrapper.find('label').text()).toBe('form.email')
      })

      it('has the label for "input-field-name-input-field"', () => {
        expect(wrapper.find('label').attributes('for')).toBe('input-field-name-input-field')
      })
    })

    describe('input value changes', () => {
      it('input value change field value', async () => {
        await wrapper.find('input').setValue('user@example.org')
        expect(wrapper.vm.value).toEqual('user@example.org')
      })
    })

    describe('email normalization', () => {
      it('trims the email', async () => {
        await wrapper.find('input').setValue('  valid@email.com  ')
        await nextTick()
        expect(wrapper.vm.value).toEqual('valid@email.com')
      })
    })
  })
})
