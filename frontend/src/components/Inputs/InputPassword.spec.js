import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
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
      // Not used any more; registered so that a box brought back around the eye would draw
      // its .input-group here as it does in the app.
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
        expect(wrapper.find('input').attributes('placeholder')).toEqual('input-field-placeholder')
      })

      it('has the value ""', () => {
        expect(wrapper.find('input').attributes('value')).toEqual('')
      })

      it('has the label "input-field-label"', () => {
        expect(wrapper.find('label').text()).toEqual('input-field-label')
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

    // Bernd, 21.09.2026: the field's rounded frame was missing on the right, over the eye.
    // The eye was a box of its own beside the input, in a variant this template does not
    // build: all it drew was a dark shadow, which the dark card swallows.
    describe('the eye', () => {
      it('stands in the field, with the input, and not in a box beside it', () => {
        const field = wrapper.find('.password-field')
        expect(field.find('input').exists()).toBe(true)
        expect(field.find('[data-test="password-eye"]').exists()).toBe(true)
        expect(wrapper.find('.input-group').exists()).toBe(false)
      })

      it('leaves the frame to the input, rounded as the e-mail field is', () => {
        expect(wrapper.find('input').classes()).toContain('rounded-input')
        expect(wrapper.find('button').classes()).not.toContain('btn-outline-light')
      })
    })
  })

  describe('the stylesheet', () => {
    const source = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), 'InputPassword.vue'),
      'utf8',
    )
    // Comments name the same properties; only declarations may count.
    const css = source
      .slice(source.indexOf('<style'), source.indexOf('</style>'))
      .replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = (selector) => {
      const at = css.indexOf(`${selector} {`)
      return at < 0 ? '' : css.slice(at, css.indexOf('}', at))
    }

    it('lays the eye over the right end of the input', () => {
      const eye = rule('.password-eye')
      expect(eye).toMatch(/position:\s*absolute;/)
      expect(eye).toMatch(/right:\s*0;/)
      expect(eye).toMatch(/border:\s*0;/)
      expect(eye).toMatch(/width:\s*var\(--password-eye\);/)
    })

    it('keeps the typed text and the warning sign clear of it', () => {
      expect(rule('.password-input')).toMatch(/padding-right:\s*var\(--password-eye\);/)
      const signs = rule('.password-input.is-valid,\n.password-input.is-invalid')
      expect(signs).toMatch(/padding-right:\s*calc\([^;]*\+ var\(--password-eye\)\);/)
      expect(signs).toMatch(
        /background-position:\s*right calc\([^;]*\+ var\(--password-eye\)\) center;/,
      )
    })
  })
})
