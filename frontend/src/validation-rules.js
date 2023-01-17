import { configure, extend } from 'vee-validate'
// eslint-disable-next-line camelcase
import { required, email, min, max, is_not } from 'vee-validate/dist/rules'

export const loadAllRules = (i18nCallback) => {
  configure({
    defaultMessage: (field, values) => {
      // eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys
      values._field_ = i18nCallback.t(`fields.${field}`)
      // eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys
      return i18nCallback.t(`validations.messages.${values._rule_}`, values)
    },
    classes: {
      valid: 'is-valid',
      invalid: 'is-invalid',
      dirty: ['is-dirty', 'is-dirty'], // multiple classes per flag!
    },
  })

  extend('email', {
    ...email,
    // eslint-disable-next-line  @intlify/vue-i18n/no-missing-keys
    message: (_, values) => i18nCallback.t('validations.messages.email', values),
  })

  extend('required', {
    ...required,
    // eslint-disable-next-line  @intlify/vue-i18n/no-missing-keys
    message: (_, values) => i18nCallback.t('validations.messages.required', values),
  })

  extend('min', {
    ...min,
    // eslint-disable-next-line  @intlify/vue-i18n/no-missing-keys
    message: (_, values) => i18nCallback.t('validations.messages.min', values),
  })

  extend('max', {
    ...max,
    // eslint-disable-next-line  @intlify/vue-i18n/no-missing-keys
    message: (_, values) => i18nCallback.t('validations.messages.max', values),
  })

  extend('gddSendAmount', {
    validate(value, { min, max }) {
      value = value.replace(',', '.')
      return value.match(/^[0-9]+(\.[0-9]{0,2})?$/) && Number(value) >= min && Number(value) <= max
    },
    params: ['min', 'max'],
    message: (_, values) => {
      values.min = i18nCallback.n(values.min, 'ungroupedDecimal')
      values.max = i18nCallback.n(values.max, 'ungroupedDecimal')
      return i18nCallback.t('form.validation.gddSendAmount', values)
    },
  })

  extend('gddCreationTime', {
    validate(value, { min, max }) {
      return value >= min && value <= max
    },
    params: ['min', 'max'],
    message: (_, values) => {
      // values.min = values.min
      // values.max = values.max
      return i18nCallback.t('form.validation.gddCreationTime', values)
    },
  })

  // eslint-disable-next-line camelcase
  extend('is_not', {
    // eslint-disable-next-line camelcase
    ...is_not,
    message: (_, values) => i18nCallback.t('form.validation.is-not', values),
  })

  // Password validation

  extend('containsLowercaseCharacter', {
    validate(value) {
      return !!value.match(/[a-z]+/)
    },
    message: (_, values) => i18nCallback.t('site.signup.lowercase', values),
  })

  extend('containsUppercaseCharacter', {
    validate(value) {
      return !!value.match(/[A-Z]+/)
    },
    message: (_, values) => i18nCallback.t('site.signup.uppercase', values),
  })

  extend('containsNumericCharacter', {
    validate(value) {
      return !!value.match(/[0-9]+/)
    },
    message: (_, values) => i18nCallback.t('site.signup.one_number', values),
  })

  extend('atLeastEightCharactera', {
    validate(value) {
      return !!value.match(/.{8,}/)
    },
    message: (_, values) => i18nCallback.t('site.signup.minimum', values),
  })

  extend('atLeastOneSpecialCharater', {
    validate(value) {
      return !!value.match(/[^a-zA-Z0-9 \t\n\r]/)
    },
    message: (_, values) => i18nCallback.t('site.signup.special-char', values),
  })

  extend('noWhitespaceCharacters', {
    validate(value) {
      return !value.match(/[ \t\n\r]+/)
    },
    message: (_, values) => i18nCallback.t('site.signup.no-whitespace', values),
  })

  extend('samePassword', {
    validate(value, [pwd]) {
      return value === pwd
    },
    message: (_, values) => i18nCallback.t('site.signup.dont_match', values),
  })
}
