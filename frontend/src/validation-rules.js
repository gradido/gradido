import i18n from './i18n.js'
import { configure, extend } from 'vee-validate'
// eslint-disable-next-line camelcase
import { required, email, min, max, is_not } from 'vee-validate/dist/rules'
import loginAPI from './apis/loginAPI'

configure({
  defaultMessage: (field, values) => {
    values._field_ = i18n.t(`fields.${field}`)
    return i18n.t(`validations.messages.${values._rule_}`, values)
  },
})

extend('email', {
  ...email,
  message: (_, values) => i18n.t('validations.messages.email', values),
})

extend('required', {
  ...required,
  message: (_, values) => i18n.t('validations.messages.required', values),
})

extend('min', {
  ...min,
  message: (_, values) => i18n.t('validations.messages.min', values),
})

extend('max', {
  ...max,
  message: (_, values) => i18n.t('validations.messages.max', values),
})

extend('gddSendAmount', {
  validate(value, { min, max }) {
    value = value.replace(',', '.')
    return value.match(/^[0-9]+(\.[0-9]{0,2})?$/) && Number(value) >= min && Number(value) <= max
  },
  params: ['min', 'max'],
  message: (_, values) => {
    values.min = i18n.n(values.min, 'ungroupedDecimal')
    values.max = i18n.n(values.max, 'ungroupedDecimal')
    return i18n.t('form.validation.gddSendAmount', values)
  },
})

extend('gddUsernameUnique', {
  async validate(value) {
    const result = await loginAPI.checkUsername(value)
    return result.result.data.state === 'success'
  },
  message: (_, values) => i18n.t('form.validation.usernmae-unique', values),
})

extend('gddUsernameRgex', {
  validate(value) {
    return !!value.match(/^[a-zA-Z][-_a-zA-Z0-9]{2,}$/)
  },
  message: (_, values) => i18n.t('form.validation.usernmae-regex', values),
})

// eslint-disable-next-line camelcase
extend('is_not', {
  // eslint-disable-next-line camelcase
  ...is_not,
  message: (_, values) => i18n.t('form.validation.is-not', values),
})

// Password validation

extend('containsLowercaseCharacter', {
  validate(value) {
    return !!value.match(/[a-z]+/)
  },
  message: (_, values) => i18n.t('site.signup.lowercase', values),
})

extend('containsUppercaseCharacter', {
  validate(value) {
    return !!value.match(/[A-Z]+/)
  },
  message: (_, values) => i18n.t('site.signup.uppercase', values),
})

extend('containsNumericCharacter', {
  validate(value) {
    return !!value.match(/[0-9]+/)
  },
  message: (_, values) => i18n.t('site.signup.one_number', values),
})

extend('atLeastEightCharactera', {
  validate(value) {
    return !!value.match(/.{8,}/)
  },
  message: (_, values) => i18n.t('site.signup.minimum', values),
})

extend('samePassword', {
  validate(value, [pwd]) {
    return value === pwd
  },
  message: (_, values) => i18n.t('site.signup.dont_match', values),
})
