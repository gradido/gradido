import { string, addMethod } from 'yup'
import { validate as validateUuid, version as versionUuid } from 'uuid'

const EMAIL_REGEX =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
const USERNAME_REGEX = /^(?=.{3,20}$)[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$/

addMethod(string, 'email', function (message) {
  return this.matches(EMAIL_REGEX, {
    name: 'email',
    message,
    excludeEmptyString: true,
  })
})

// TODO: only needed for grace period, before all inputs updated for using veeValidate + yup
export const isLanguageKey = (str) =>
  str.match(/^(?!\.)[a-z][a-zA-Z0-9-]*([.][a-z][a-zA-Z0-9-]*)*(?<!\.)$/)

export const translateYupErrorString = (error, t) => {
  const type = typeof error
  if (type === 'object') {
    return t(error.key, error.values)
  } else if (type === 'string' && error.length > 0 && isLanguageKey(error)) {
    return t(error)
  } else {
    return error
  }
}

export const memo = string()
  .required('contribution.yourActivity')
  .min(5, ({ min }) => ({ key: 'form.validation.memo.min', values: { min } }))
  .max(255, ({ max }) => ({ key: 'form.validation.memo.max', values: { max } }))

export const identifier = string()
  .required('form.validation.identifier')
  .nonNullable()
  .test('is-identifier', 'form.validation.identifier', (value) => {
    const isEmail = EMAIL_REGEX.test(value)
    const isUsername = USERNAME_REGEX.test(value)
    const isGradidoId = validateUuid(value) && versionUuid(value) === 4
    const isEmpty = value === '' || value === undefined || value === null
    console.log('validateIdentifier', { value, isEmail, isUsername, isGradidoId })
    return isEmail || isUsername || isGradidoId || isEmpty
  })
