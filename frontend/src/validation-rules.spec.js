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
import { loadAllRules } from '@/validation-rules'
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

describe('the password fields', () => {
  const global = {
    plugins: [i18n],
    components: { BButton, BCol, BFormGroup, BFormInput, BFormInvalidFeedback, BRow },
    stubs: { IBiEye: true, IBiEyeSlash: true },
  }

  const messagesUnder = async (component, props) => {
    const wrapper = mount(component, { props, global })
    await flushPromises()
    return wrapper.findAll('.invalid-feedback').map((feedback) => feedback.text())
  }

  it('name the old password of the settings as its label does', async () => {
    expect(
      await messagesUnder(InputPassword, { label: 'Altes Passwort', immediate: true }),
    ).toEqual(['Altes Passwort ist ein Pflichtfeld'])
  })

  it('name the new password "Neues Passwort" where a password is changed', async () => {
    const [first, second] = await messagesUnder(InputPasswordConfirmation, {})

    expect(first).toMatch(/^Neues Passwort ist ein Pflichtfeld/)
    expect(second).toBe('Neues Passwort wiederholen ist ein Pflichtfeld')
  })

  it('name it "Passwort" where an account gets its first password', async () => {
    const [first, second] = await messagesUnder(InputPasswordConfirmation, { register: true })

    expect(first).toMatch(/^Passwort ist ein Pflichtfeld/)
    expect(second).toBe('Passwort wiederholen ist ein Pflichtfeld')
  })
})
