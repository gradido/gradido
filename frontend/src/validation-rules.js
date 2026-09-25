import { configure, defineRule } from 'vee-validate'
import { required, email, min, max } from '@vee-validate/rules'
import { checkUsername } from '@/graphql/queries'
import { validate as validateUuid, version as versionUuid } from 'uuid'
import { unref } from 'vue'
import { localize, setLocale } from '@vee-validate/i18n'
import en from '@vee-validate/i18n/dist/locale/en.json'
import de from '@vee-validate/i18n/dist/locale/de.json'
import es from '@vee-validate/i18n/dist/locale/es.json'
import fr from '@vee-validate/i18n/dist/locale/fr.json'
import nl from '@vee-validate/i18n/dist/locale/nl.json'
import tr from '@vee-validate/i18n/dist/locale/tr.json'
import it from '@vee-validate/i18n/dist/locale/it.json'
import ru from '@vee-validate/i18n/dist/locale/ru.json'
import pt from '@vee-validate/i18n/dist/locale/pt_PT.json'
import el from '@vee-validate/i18n/dist/locale/el.json'
import { useI18n } from 'vue-i18n'

// username regex pattern remain the same
const USERNAME_REGEX = /^(?=.{3,20}$)[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$/

/**
 * What a field shows of its check: nothing before it has been left once, green as soon as what
 * was typed into it is valid, and red - with its message - only after the first blur. The send
 * and the contribution forms work this way (ValidatedInput); the sign-in and registration forms
 * showed every empty field red the moment they opened, before anybody had typed. `meta` is
 * vee-validate's field meta; the blur has to validate (`handleBlur(event, true)`), or a field
 * left empty turns red without saying why.
 *
 * Green asks for `dirty` as well: vee-validate starts a field with `valid: true` and checks it
 * silently a moment later, so without it every empty field flashed green as the page opened.
 */
export const shownValidState = (meta) =>
  meta.touched ? meta.valid : meta.dirty && meta.valid ? true : null

export const loadAllRules = (i18nCallback, apollo) => {
  // vee-validate's own rules (email, min, max) take their sentences from its dictionary.
  const ruleMessage = localize({
    en,
    de,
    es,
    fr,
    nl,
    tr,
    it,
    ru,
    pt,
    el,
  })
  configure({
    generateMessage: (context) => {
      const { t, locale } = i18nCallback || useI18n()

      // A message names the field as its label does where the component hands the label over
      // (InputPassword: "Altes Passwort", or plain "Passwort" where an account gets its first),
      // and by `form.<name>` everywhere else - validationFieldNames.drift.spec.js holds that
      // key for every name.
      // eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys
      const fieldName = context.label || t(`form.${context.name}`)
      if (context.rule.name === 'required') {
        return t('form.validation.requiredField', { fieldName })
      }
      // The dictionary keeps a language of its own and starts in English; only the language
      // switch used to move it, so a German wallet read "The email field must be a valid
      // email". It is set to the wallet's language with every message instead.
      setLocale(unref(locale))
      return ruleMessage({ ...context, label: fieldName })
    },
    validateOnBlur: true,
    validateOnChange: true,
    validateOnInput: false,
    validateOnModelUpdate: true,
  })

  // Define built-in rules
  defineRule('required', required)
  defineRule('email', email)
  defineRule('min', min)
  defineRule('max', max)

  // ------ Custom rules ------
  defineRule('is_not', (value, [otherValue]) => {
    return value !== otherValue
      ? true
      : i18nCallback.t('form.validation.is-not', { other: otherValue })
  })

  defineRule('containsLowercaseCharacter', (value) => {
    const isMatch = value && !!value.match(/[a-z]+/)
    return isMatch || i18nCallback.t('site.signup.lowercase')
  })

  defineRule('containsUppercaseCharacter', (value) => {
    const isMatch = value && !!value.match(/[A-Z]+/)
    return isMatch || i18nCallback.t('site.signup.uppercase')
  })

  defineRule('containsNumericCharacter', (value) => {
    const isMatch = value && !!value.match(/[0-9]+/)
    return isMatch || i18nCallback.t('site.signup.one_number')
  })

  defineRule('atLeastEightCharacters', (value) => {
    const isMatch = value && !!value.match(/.{8,}/)
    return isMatch || i18nCallback.t('site.signup.minimum')
  })

  defineRule('atLeastOneSpecialCharacter', (value) => {
    const isMatch = value && !!value.match(/[^a-zA-Z0-9 \t\n\r]/)
    return isMatch || i18nCallback.t('site.signup.special-char')
  })

  defineRule('noWhitespaceCharacters', (value) => {
    const isMatch = value && !value.match(/[ \t\n\r]+/)
    return isMatch || i18nCallback.t('site.signup.no-whitespace')
  })

  defineRule('samePassword', (value, [pwd], ctx) => {
    return value === ctx.form[pwd] || i18nCallback.t('site.signup.dont_match')
  })

  defineRule('usernameAllowedChars', (value) => {
    const isMatch = value && !!value.match(/^[a-zA-Z0-9_-]+$/)
    return isMatch || i18nCallback.t('form.validation.username-allowed-chars')
  })

  defineRule('usernameHyphens', (value) => {
    const isMatch = value && !!value.match(/^[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$/)
    return isMatch || i18nCallback.t('form.validation.username-hyphens')
  })

  defineRule('usernameUnique', async (value) => {
    if (!value.match(USERNAME_REGEX)) return true
    const { data } = await apollo.query({
      query: checkUsername,
      variables: { username: value },
    })
    return data.checkUsername || i18nCallback.t('form.validation.username-unique')
  })
}
