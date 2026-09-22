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
        const field = wrapper.find('.reveal-field')
        expect(field.find('input').exists()).toBe(true)
        expect(field.find('[data-test="password-eye"]').exists()).toBe(true)
        expect(wrapper.find('.input-group').exists()).toBe(false)
      })

      // The eye is drawn by the rules it shares with the thank-you card's PIN
      // (assets/scss/_reveal-field.scss, checked in src/revealField.spec.js). They are written
      // for these two selectors, children and all: one wrapper more, and none of them applies.
      it('is reached by the rules it shares with the PIN', () => {
        expect(wrapper.find('input').element.matches('.reveal-field > .form-control')).toBe(true)
        const eye = wrapper.find('[data-test="password-eye"]')
        expect(eye.element.matches('.reveal-field > .reveal-eye')).toBe(true)
      })

      it('leaves the frame to the input, rounded as the e-mail field is', () => {
        expect(wrapper.find('input').classes()).toContain('rounded-input')
        expect(wrapper.find('button').classes()).not.toContain('btn-outline-light')
      })

      // coderabbit on #3948: out of the tab order, the only way to check a typed password
      // was a mouse. A native button turns Enter and Space into the click tested above, so
      // what the keyboard needs is to reach it -- and not to submit the form on the way.
      it('can be reached from the keyboard, and does not submit the form', () => {
        const eye = wrapper.find('[data-test="password-eye"]')
        expect(eye.element.tagName).toBe('BUTTON')
        expect(eye.attributes('tabindex')).toBeUndefined()
        expect(eye.attributes('type')).toBe('button')
      })

      it('says what it will do, for a screen reader', async () => {
        const eye = wrapper.find('[data-test="password-eye"]')
        expect(eye.attributes('aria-label')).toBe('form.showPassword')
        await eye.trigger('click')
        expect(eye.attributes('aria-label')).toBe('form.hidePassword')
      })
    })
  })

  // The eye's place, its frame and its focus ring are shared with the PIN and checked in
  // src/revealField.spec.js. What stays here is the password's own: Bootstrap's signs.
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

    it('keeps the warning and the check sign clear of the eye', () => {
      const signs = rule('.password-input.is-valid,\n.password-input.is-invalid')
      expect(signs).toMatch(/padding-right:\s*calc\([^;]*\+ var\(--reveal-eye\)\);/)
      expect(signs).toMatch(
        /background-position:\s*right calc\([^;]*\+ var\(--reveal-eye\)\) center;/,
      )
    })
  })
})
