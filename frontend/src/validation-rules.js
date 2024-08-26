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

// Email and username regex patterns remain the same
const EMAIL_REGEX =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
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
  defineRule('gddSendAmount', (value, { min, max }) => {
    value = value.replace(',', '.')
    return value.match(/^[0-9]+(\.[0-9]{0,2})?$/) && Number(value) >= min && Number(value) <= max
      ? true
      : i18nCallback.t('form.validation.gddSendAmount', {
          min: i18nCallback.n(min, 'ungroupedDecimal'),
          max: i18nCallback.n(max, 'ungroupedDecimal'),
        })
  })

  defineRule('gddCreationTime', (value, { min, max }) => {
    return value >= min && value <= max
      ? true
      : i18nCallback.t('form.validation.gddCreationTime', { min, max })
  })

  defineRule('is_not', (value, [otherValue]) => {
    return value !== otherValue
      ? true
      : i18nCallback.t('form.validation.is-not', { other: otherValue })
  })

  defineRule('containsLowercaseCharacter', (value) => {
    return !!value.match(/[a-z]+/) || i18nCallback.t('site.signup.lowercase')
  })

  defineRule('containsUppercaseCharacter', (value) => {
    return !!value.match(/[A-Z]+/) || i18nCallback.t('site.signup.uppercase')
  })

  defineRule('containsNumericCharacter', (value) => {
    return !!value.match(/[0-9]+/) || i18nCallback.t('site.signup.one_number')
  })

  defineRule('atLeastEightCharacters', (value) => {
    return !!value.match(/.{8,}/) || i18nCallback.t('site.signup.minimum')
  })

  defineRule('atLeastOneSpecialCharacter', (value) => {
    return !!value.match(/[^a-zA-Z0-9 \t\n\r]/) || i18nCallback.t('site.signup.special-char')
  })

  defineRule('noWhitespaceCharacters', (value) => {
    return !value.match(/[ \t\n\r]+/) || i18nCallback.t('site.signup.no-whitespace')
  })

  defineRule('samePassword', (value, [pwd], ctx) => {
    return value === ctx.form[pwd] || i18nCallback.t('site.signup.dont_match')
  })

  defineRule('usernameAllowedChars', (value) => {
    return (
      !!value.match(/^[a-zA-Z0-9_-]+$/) || i18nCallback.t('form.validation.username-allowed-chars')
    )
  })

  defineRule('usernameHyphens', (value) => {
    return (
      !!value.match(/^[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$/) ||
      i18nCallback.t('form.validation.username-hyphens')
    )
  })

  defineRule('usernameUnique', async (value) => {
    if (!value.match(USERNAME_REGEX)) return true
    const { data } = await apollo.query({
      query: checkUsername,
      variables: { username: value },
    })
    return data.checkUsername || i18nCallback.t('form.validation.username-unique')
  })

  defineRule('validIdentifier', (value) => {
    const isEmail = !!EMAIL_REGEX.test(value)
    const isUsername = !!value.match(USERNAME_REGEX)
    const isGradidoId = validateUuid(value) && versionUuid(value) === 4
    return (
      isEmail || isUsername || isGradidoId || i18nCallback.t('form.validation.valid-identifier')
    )
  })
}
