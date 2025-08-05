import { configure, defineRule } from 'vee-validate'
import { required, email, min, max } from '@vee-validate/rules'
import { checkUsername } from '@/graphql/queries'
import { validate as validateUuid, version as versionUuid } from 'uuid'
import { localize } from '@vee-validate/i18n'
import en from '@vee-validate/i18n/dist/locale/en.json'
import de from '@vee-validate/i18n/dist/locale/de.json'
import es from '@vee-validate/i18n/dist/locale/es.json'
import fr from '@vee-validate/i18n/dist/locale/fr.json'
import nl from '@vee-validate/i18n/dist/locale/nl.json'
import tr from '@vee-validate/i18n/dist/locale/tr.json'
import { useI18n } from 'vue-i18n'

// username regex pattern remain the same
const USERNAME_REGEX = /^(?=.{3,20}$)[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$/

export const loadAllRules = (i18nCallback, apollo) => {
  configure({
    generateMessage: (context) => {
      const { t } = i18nCallback || useI18n()

      const translationKey = `form.${context.name}`
      if (context.rule.name === 'required') {
        // eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys
        return t('form.validation.requiredField', { fieldName: t(translationKey) })
      }
      return localize({
        en,
        de,
        es,
        fr,
        nl,
        tr,
      })(context)
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
