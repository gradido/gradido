import { configure, extend } from 'vee-validate'
import { required, email, min } from 'vee-validate/dist/rules'
import i18n from './i18n'

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
