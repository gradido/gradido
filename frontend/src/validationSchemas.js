import { string } from 'yup'
import { validate as validateUuid, version as versionUuid } from 'uuid'

// Email and username regex patterns remain the same
const EMAIL_REGEX =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
const USERNAME_REGEX = /^(?=.{3,20}$)[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$/

// TODO: only needed for grace period, before all inputs updated for using veeValidate + yup
export const isLanguageKey = (str) =>
  str.match(/^(?!\.)[a-z][a-zA-Z0-9-]*([.][a-z][a-zA-Z0-9-]*)*(?<!\.)$/)

export const translateYupErrorString = (error, t) => {
  const type = typeof error
  if (type === 'object' && error.key && typeof error.key === 'string') {
    return t(error.key, error.values)
  } else if (type === 'string' && error.length > 0 && isLanguageKey(error)) {
    return t(error)
  } else {
    return error
  }
}

export const memo = string()
  .required('form.validation.memo.required')
  .min(5, ({ min }) => ({ key: 'form.validation.memo.min', values: { min } }))
  .max(255, ({ max }) => ({ key: 'form.validation.memo.max', values: { max } }))

export const identifier = string()
  .required('form.validation.identifier.required')
  .test('valid-identifier', 'form.validation.identifier.typeError', (value) => {
    const isEmail = !!EMAIL_REGEX.test(value)
    const isUsername = !!value.match(USERNAME_REGEX)
    // TODO: use valibot and rules from shared
    const isGradidoId = validateUuid(value) && versionUuid(value) === 4
    return isEmail || isUsername || isGradidoId
  })
