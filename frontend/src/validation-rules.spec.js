// AI-GENERATED — not an architecture reference

import { describe, it, expect, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { validate } from 'vee-validate'
import { setLocale } from '@vee-validate/i18n'
import {
  BButton,
  BCol,
  BFormGroup,
  BFormInput,
  BFormInvalidFeedback,
  BRow,
} from 'bootstrap-vue-next'
import { loadAllRules, shownValidState } from '@/validation-rules'
import InputEmail from '@/components/Inputs/InputEmail'
import InputPassword from '@/components/Inputs/InputPassword'
import InputPasswordConfirmation from '@/components/Inputs/InputPasswordConfirmation'
import de from '@/locales/de.json'
import en from '@/locales/en.json'

/**
 * What a member reads under a field that breaks a rule, built through the real rules:
 * - in the wallet's language, for vee-validate's own rules (email, min) too. Their
 *   sentences come from vee-validate's dictionary, which has a language of its own and
 *   starts in English: a German wallet showed "The email field must be a valid email" until
 *   21.09.2026;
 * - naming the field as its label does where the component hands the label over
 *   (InputPassword), and by `form.<name>` elsewhere.
 */
const i18n = createI18n({
  legacy: false,
  locale: 'de',
  fallbackLocale: 'en',
  messages: { de, en },
  missingWarn: false,
  fallbackWarn: false,
})
loadAllRules(i18n.global, null)

const messageFor = async (value, rules, options) =>
  (await validate(value, rules, options)).errors[0]

afterEach(() => {
  i18n.global.locale.value = 'de'
})

describe('a validation message', () => {
  it('is in the wallet language for vee-validate rules, whatever language its dictionary had', async () => {
    // Where the dictionary stands on a fresh page: English.
    setLocale('en')

    expect(await messageFor('abc', 'required|email', { name: 'email' })).toBe(
      'E-Mail muss eine gültige E-Mail-Adresse sein',
    )
    expect(await messageFor('Jo', { required: true, min: 3 }, { name: 'firstname' })).toBe(
      'Vorname muss mindestens 3 Zeichen lang sein',
    )
  })

  it('follows the wallet into another language and back', async () => {
    i18n.global.locale.value = 'en'
    expect(await messageFor('abc', 'required|email', { name: 'email' })).toBe(
      'The Email field must be a valid email',
    )

    i18n.global.locale.value = 'de'
    expect(await messageFor('abc', 'required|email', { name: 'email' })).toBe(
      'E-Mail muss eine gültige E-Mail-Adresse sein',
    )
  })

  it('names the field by the label it is given', async () => {
    expect(await messageFor('', 'required', { name: 'password', label: 'Altes Passwort' })).toBe(
      'Altes Passwort ist ein Pflichtfeld',
    )
    expect(await messageFor('Jo', { min: 3 }, { name: 'firstname', label: 'Rufname' })).toBe(
      'Rufname muss mindestens 3 Zeichen lang sein',
    )
  })

  it('names the field by form.<name> where no label is given', async () => {
    expect(await messageFor('', 'required', { name: 'newPassword' })).toBe(
      'Neues Passwort ist ein Pflichtfeld',
    )
  })
})

/**
 * TISCH-05 point 2: the sign-in and registration forms showed every empty field red, and seven
 * red rules under the password, the moment they opened. A field now shows nothing before it has
 * been left once, green as soon as it is valid, and red with its message after the first blur.
 */
describe('what a field shows of its check', () => {
  it('shows nothing while it has not been left and is not valid yet', () => {
    expect(shownValidState({ touched: false, dirty: true, valid: false })).toBe(null)
  })

  // vee-validate starts a field valid and checks it a moment later.
  it('shows nothing while nothing has been typed, even where the field still counts as valid', () => {
    expect(shownValidState({ touched: false, dirty: false, valid: true })).toBe(null)
  })

  it('shows green as soon as what was typed is valid, left or not', () => {
    expect(shownValidState({ touched: false, dirty: true, valid: true })).toBe(true)
    expect(shownValidState({ touched: true, dirty: true, valid: true })).toBe(true)
  })

  it('shows red once it has been left and is not valid', () => {
    expect(shownValidState({ touched: true, dirty: false, valid: false })).toBe(false)
  })
})

describe('the password fields', () => {
  const global = {
    plugins: [i18n],
    components: { BButton, BCol, BFormGroup, BFormInput, BFormInvalidFeedback, BRow },
    stubs: { IBiEye: true, IBiEyeSlash: true },
  }

  const mounted = async (component, props) => {
    const wrapper = mount(component, { props, global })
    await flushPromises()
    return wrapper
  }
  const messages = (wrapper) =>
    wrapper.findAll('.invalid-feedback').map((feedback) => feedback.text())
  const leaveAll = async (wrapper) => {
    for (const input of wrapper.findAll('input')) {
      await input.trigger('blur')
    }
    await flushPromises()
  }
  const messagesAfterLeaving = async (component, props) => {
    const wrapper = await mounted(component, props)
    await leaveAll(wrapper)
    return messages(wrapper)
  }

  it('name the old password of the settings as its label does', async () => {
    expect(await messagesAfterLeaving(InputPassword, { label: 'Altes Passwort' })).toEqual([
      'Altes Passwort ist ein Pflichtfeld',
    ])
  })

  it('name the new password "Neues Passwort" where a password is changed', async () => {
    const [first, second] = await messagesAfterLeaving(InputPasswordConfirmation, {})

    expect(first).toMatch(/^Neues Passwort ist ein Pflichtfeld/)
    expect(second).toBe('Neues Passwort wiederholen ist ein Pflichtfeld')
  })

  it('name it "Passwort" where an account gets its first password', async () => {
    const [first, second] = await messagesAfterLeaving(InputPasswordConfirmation, {
      register: true,
    })

    expect(first).toMatch(/^Passwort ist ein Pflichtfeld/)
    expect(second).toBe('Passwort wiederholen ist ein Pflichtfeld')
  })

  it('show nothing before they have been left', async () => {
    // Also in the first moment, before vee-validate's silent check: it starts a field valid.
    const first = mount(InputPasswordConfirmation, { props: { register: true }, global })
    for (const input of first.findAll('input')) {
      expect(input.classes()).not.toContain('is-valid')
    }

    const wrapper = await mounted(InputPasswordConfirmation, { register: true })

    expect(messages(wrapper)).toEqual([])
    for (const input of wrapper.findAll('input')) {
      expect(input.classes()).not.toContain('is-invalid')
      expect(input.classes()).not.toContain('is-valid')
      expect(input.attributes('aria-invalid')).toBe('false')
    }
  })

  it('show the rules a password still misses once it is left unfinished', async () => {
    const wrapper = await mounted(InputPasswordConfirmation, { register: true })
    const password = wrapper.find('#newPassword-input-field')

    await password.setValue('a')
    await flushPromises()
    expect(messages(wrapper)).toEqual([])

    await password.trigger('blur')
    await flushPromises()

    expect(password.classes()).toContain('is-invalid')
    expect(password.attributes('aria-invalid')).toBe('true')
    // One rule per line, each in a span of its own.
    const rules = wrapper.findAll('#newPassword-feedback span').map((rule) => rule.text())
    const missing = de.site.signup
    expect(rules).toEqual([
      missing.uppercase,
      missing.one_number,
      missing.minimum,
      missing['special-char'],
    ])
  })

  it('turn green as soon as the password is valid, before it is left', async () => {
    const wrapper = await mounted(InputPasswordConfirmation, { register: true })
    const password = wrapper.find('#newPassword-input-field')

    await password.setValue('Aa12345_')
    await flushPromises()

    expect(password.classes()).toContain('is-valid')
    expect(messages(wrapper)).toEqual([])
  })

  // A newcomer's page starts in the default language and switches to the browser's after it is
  // built. The messages come when a field is left, so they name it in the language it is shown
  // in: under the German "Passwort" there stood "Password ist ein Pflichtfeld".
  it('name the field in the language the page has switched to since it was built', async () => {
    i18n.global.locale.value = 'en'
    const wrapper = await mounted(InputPasswordConfirmation, { register: true })
    i18n.global.locale.value = 'de'
    await flushPromises()

    await leaveAll(wrapper)

    const [first, second] = messages(wrapper)
    expect(first).toMatch(/^Passwort ist ein Pflichtfeld/)
    expect(second).toBe('Passwort wiederholen ist ein Pflichtfeld')
  })
})

describe('the e-mail field', () => {
  const mountEmail = () =>
    mount(InputEmail, {
      global: {
        plugins: [i18n],
        components: { BFormGroup, BFormInput, BFormInvalidFeedback },
        mocks: { $route: { path: '/login' } },
      },
    })
  const mounted = async () => {
    const wrapper = mountEmail()
    await flushPromises()
    return wrapper
  }

  it('shows nothing before it has been left, and says it is not invalid', async () => {
    // Also in the first moment, before vee-validate's silent check.
    expect(mountEmail().find('input').classes()).not.toContain('is-valid')

    const input = (await mounted()).find('input')

    expect(input.classes()).not.toContain('is-invalid')
    expect(input.classes()).not.toContain('is-valid')
    expect(input.attributes('aria-invalid')).toBe('false')
  })

  // Leaving the field checks it: left empty, it is not only red, it says why.
  it('says it is required once it is left empty', async () => {
    const wrapper = await mounted()

    await wrapper.find('input').trigger('blur')
    await flushPromises()

    expect(wrapper.find('input').classes()).toContain('is-invalid')
    expect(wrapper.find('.invalid-feedback').text()).toBe('E-Mail ist ein Pflichtfeld')
  })

  it('turns red with its message once it is left with an address that is not one', async () => {
    const wrapper = await mounted()
    const input = wrapper.find('input')

    await input.setValue('abc')
    await input.trigger('blur')
    await flushPromises()

    expect(input.classes()).toContain('is-invalid')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('.invalid-feedback').text()).toBe(
      'E-Mail muss eine gültige E-Mail-Adresse sein',
    )
  })
})
