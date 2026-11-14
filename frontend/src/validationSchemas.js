import { number, string } from 'yup'
import { validate as validateUuid, version as versionUuid } from 'uuid'
import { splitRecipient } from '@/utils/gradidoAddress'

// Email and username regex patterns remain the same
const EMAIL_REGEX =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
export const USERNAME_REGEX = /^(?=.{3,20}$)[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$/

// Whether a recipient, without its community, has the shape of an e-mail address: the one rule
// for the field and for what the send page offers such a recipient.
export const isEmailIdentifier = (value) => EMAIL_REGEX.test(value)

// Nobody may hold these names. Keep in step with RESERVED_ALIAS in
// shared/src/schema/user.schema.ts - the frontend cannot yet import from it.
export const RESERVED_ALIAS = [
  'admin',
  'email',
  'gast',
  'gdd',
  'gradido',
  'guest',
  'home',
  'root',
  'support',
  'temp',
  'tmp',
  'user',
  'usr',
  'var',
  'reserved',
  'undefined',
  'unknown',
]

// A name the server takes as a user name (aliasSchema in shared): the shape, and no reserved word.
export const isValidUsername = (value) =>
  USERNAME_REGEX.test(value) && !RESERVED_ALIAS.includes(value.toLowerCase())

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

/**
 * An amount a member types: a number of at least 0.01 and at most `max`, with a comma or a
 * point and no more than two decimals. Written once, for the send form and for the thank-you
 * greeting: two copies of a rule are two rules as soon as one of them learns something.
 *
 * @param {number} max the most this amount may be -- the balance, or less where the amount
 *   is held with a reserve (`linkAmountMax`)
 */
export const amount = (max) =>
  number()
    .required()
    .typeError({
      key: 'form.validation.amount.typeError',
      values: { min: 0.01, max },
    })
    .transform((value, originalValue) => {
      if (typeof originalValue === 'string') {
        return Number(originalValue.replace(',', '.'))
      }
      return value
    })
    .min(0.01, ({ min }) => ({ key: 'form.validation.amount.min', values: { min } }))
    .max(max, ({ max }) => ({ key: 'form.validation.amount.max', values: { max } }))
    .test('decimal-places', 'form.validation.amount.decimal-places', (value) => {
      if (value === undefined || value === null) return true
      return /^\d+(\.\d{0,2})?$/.test(value.toString())
    })

// A memo travels with a transaction: it is stored in a varchar(512) column and is
// re-validated by the dlt-connector. Keep these bounds in step with MEMO_*_CHARS in
// the shared package - the frontend cannot yet import from it.
export const memo = string()
  .required('form.validation.memo.required')
  .min(5, ({ min }) => ({ key: 'form.validation.memo.min', values: { min } }))
  .max(512, ({ max }) => ({ key: 'form.validation.memo.max', values: { max } }))

// A person-to-person message carries no amount and is stored in no varchar column,
// so it may be longer than a memo, and a short reply like "Yes" has to pass as well.
// Keep in step with MESSAGE_*_CHARS in the shared package -- validationSchemas.drift.spec.js
// holds the two together, and shared says what the upper bound is bounded by. Reuses the memo
// wording: those texts already say "message" and interpolate the bound.
// The upper bound is exported for the fields that stop there: the chat's compose bar, and the
// words that go with a forwarded message.
export const MESSAGE_MAX_CHARS = 5000

export const message = string()
  .required('form.validation.memo.required')
  .min(1, ({ min }) => ({ key: 'form.validation.memo.min', values: { min } }))
  .max(MESSAGE_MAX_CHARS, ({ max }) => ({ key: 'form.validation.memo.max', values: { max } }))

// A support request (SUA-015, SUA-020): the words of a message, and at least a few of them. A
// member files at most so many requests in 24 hours, and a thread holds at most so many messages
// -- the words the wallet shows where the server refuses at either. Keep in step with
// SUPPORT_TICKET_* in the shared package; validationSchemas.drift.spec.js holds them together.
export const SUPPORT_TICKET_TEXT_MIN_CHARS = 5
export const SUPPORT_TICKETS_PER_DAY_MAX = 10
export const SUPPORT_TICKET_MESSAGES_MAX = 100

export const supportTicketText = string()
  .trim()
  .required('form.validation.memo.required')
  .min(SUPPORT_TICKET_TEXT_MIN_CHARS, ({ min }) => ({
    key: 'form.validation.memo.min',
    values: { min },
  }))
  // ... and counted as the server counts (SupportTicket.schema.ts): "🌸🌸🌸" is three characters,
  // not six, or the wallet lets through what the server refuses. A test of its own beside
  // `min`, not in its place: ValidatedInput reads `min` and its number from describe().
  .test({
    name: 'minCharacters',
    params: { min: SUPPORT_TICKET_TEXT_MIN_CHARS },
    message: ({ min }) => ({ key: 'form.validation.memo.min', values: { min } }),
    test: (value) => Array.from(value ?? '').length >= SUPPORT_TICKET_TEXT_MIN_CHARS,
  })
  .max(MESSAGE_MAX_CHARS, ({ max }) => ({ key: 'form.validation.memo.max', values: { max } }))

export const subject = string()
  .required('form.validation.subject.required')
  .min(5, ({ min }) => ({ key: 'form.validation.subject.min', values: { min } }))
  .max(100, ({ max }) => ({ key: 'form.validation.subject.max', values: { max } }))

export const identifier = string()
  .required('form.validation.identifier.required')
  .test(
    'valid-shape',
    'form.validation.identifier.formatError',
    (value) => splitRecipient(value) !== null,
  )
  .test('valid-identifier', 'form.validation.identifier.typeError', (value) => {
    const parts = splitRecipient(value)
    // An unreadable shape is already reported by valid-shape; saying it twice would put
    // whichever message yup picks first under the field, and that is the less helpful one.
    if (!parts) return true
    const userPart = parts.user

    const isEmail = isEmailIdentifier(userPart)
    const isUsername = !!userPart.match(USERNAME_REGEX)
    // TODO: use valibot and rules from shared
    const isGradidoId = validateUuid(userPart) && versionUuid(userPart) === 4
    return isEmail || isUsername || isGradidoId
  })
