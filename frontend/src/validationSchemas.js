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

// A memo travels with a transaction: it is stored in a varchar(512) column and is
// re-validated by the dlt-connector. Keep these bounds in step with MEMO_*_CHARS in
// the shared package - the frontend cannot yet import from it.
export const memo = string()
  .required('form.validation.memo.required')
  .min(5, ({ min }) => ({ key: 'form.validation.memo.min', values: { min } }))
  .max(512, ({ max }) => ({ key: 'form.validation.memo.max', values: { max } }))

// A person-to-person message carries no amount and is stored in no varchar column,
// so it may be longer than a memo, and a short reply like "Yes" has to pass as well.
// Keep in step with MESSAGE_*_CHARS in the shared package. Reuses the memo wording:
// those texts already say "message" and interpolate the bound.
export const message = string()
  .required('form.validation.memo.required')
  .min(1, ({ min }) => ({ key: 'form.validation.memo.min', values: { min } }))
  .max(2000, ({ max }) => ({ key: 'form.validation.memo.max', values: { max } }))

export const subject = string()
  .required('form.validation.subject.required')
  .min(5, ({ min }) => ({ key: 'form.validation.subject.min', values: { min } }))
  .max(100, ({ max }) => ({ key: 'form.validation.subject.max', values: { max } }))

export const identifier = string()
  .required('form.validation.identifier.required')
  .test(
    'valid-parts',
    'form.validation.identifier.partsError',
    (value) => (value.match(/\//g) || []).length <= 1, // allow only one or zero slash
  )
  .test('valid-identifier', 'form.validation.identifier.typeError', (value) => {
    let userPart = value
    const parts = value.split('/')
    if (parts.length === 2) {
      userPart = parts[1]
    }

    const isEmail = !!EMAIL_REGEX.test(userPart)
    const isUsername = !!userPart.match(USERNAME_REGEX)
    // TODO: use valibot and rules from shared
    const isGradidoId = validateUuid(userPart) && versionUuid(userPart) === 4
    return isEmail || isUsername || isGradidoId
  })
