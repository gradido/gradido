import {
  MEMO_MAX_CHARS,
  MEMO_MIN_CHARS,
  MESSAGE_MAX_CHARS,
  MESSAGE_MIN_CHARS,
  SUPPORT_TICKET_TEXT_MIN_CHARS,
} from 'shared/browser'
import * as v from 'valibot'
import { t } from '@/i18n'

// The rules of the wallet's form fields, for the schema of a form (`components/Form.ts`). A
// rule's sentence is a function: it is said in the language shown when the value is checked.

// The sentences of an amount and of a number of hours, which follow the same rule.
const AMOUNT_TEXTS = {
  amount: {
    required: () => t('form.validation.requiredField', { fieldName: t('form.amount') }),
    noNumber: (max: number) => t('form.validation.amount.typeError', { min: 0.01, max }),
    min: () => t('form.validation.amount.min', { min: 0.01 }),
    max: (max: number) => t('form.validation.amount.max', { max }),
    decimals: () => t('form.validation.amount.decimal-places'),
  },
  hours: {
    required: () => t('form.validation.requiredField', { fieldName: t('form.hours') }),
    noNumber: (max: number) => t('form.validation.hours.typeError', { min: 0.01, max }),
    min: () => t('form.validation.hours.min', { min: 0.01 }),
    max: (max: number) => t('form.validation.hours.max', { max }),
    decimals: () => t('form.validation.hours.decimal-places'),
  },
}

/**
 * An amount as it is typed, given out as a number: from 0.01 to `max`, with two decimals at
 * most, a comma taken as a point (`,5` is 0.5). Digits only: `1e3` and `0x10`, which
 * JavaScript reads as numbers, are none here.
 */
export function amountSchema(max: number, of: keyof typeof AMOUNT_TEXTS = 'amount') {
  const texts = AMOUNT_TEXTS[of]
  return v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty(texts.required),
    // with a minus, so that an amount below zero is told its least, not that it is no number
    v.regex(/^-?(\d+[.,]?\d*|[.,]\d+)$/, () => texts.noNumber(max)),
    // not reached by what is no number: valibot transforms only what passed so far
    v.transform((typed) => Number(typed.replace(',', '.'))),
    v.minValue(0.01, texts.min),
    v.maxValue(max, () => texts.max(max)),
    // after the bounds: an amount too large is told so first
    v.check((amount) => Number(amount.toFixed(2)) === amount, texts.decimals),
  )
}

/** What a transaction is for. */
export const memoSchema = v.pipe(
  v.string(),
  v.nonEmpty(() => t('form.validation.memo.required')),
  v.minLength(MEMO_MIN_CHARS, () => t('form.validation.memo.min', { min: MEMO_MIN_CHARS })),
  v.maxLength(MEMO_MAX_CHARS, () => t('form.validation.memo.max', { max: MEMO_MAX_CHARS })),
)

/** A message to a contribution or in a conversation. */
export const messageSchema = v.pipe(
  v.string(),
  v.nonEmpty(() => t('form.validation.memo.required')),
  v.minLength(MESSAGE_MIN_CHARS, () => t('form.validation.memo.min', { min: MESSAGE_MIN_CHARS })),
  v.maxLength(MESSAGE_MAX_CHARS, () => t('form.validation.memo.max', { max: MESSAGE_MAX_CHARS })),
)

/**
 * The words of a support request, given out without the blanks around them. Its least length
 * is counted in characters as a reader sees them: an emoji is one, not two.
 */
export const supportTicketTextSchema = v.pipe(
  v.string(),
  v.trim(),
  v.nonEmpty(() => t('form.validation.memo.required')),
  v.check(
    (text) => Array.from(text).length >= SUPPORT_TICKET_TEXT_MIN_CHARS,
    () => t('form.validation.memo.min', { min: SUPPORT_TICKET_TEXT_MIN_CHARS }),
  ),
  v.maxLength(MESSAGE_MAX_CHARS, () => t('form.validation.memo.max', { max: MESSAGE_MAX_CHARS })),
)

/** The subject of a transaction. */
export const subjectSchema = v.pipe(
  v.string(),
  v.nonEmpty(() => t('form.validation.subject.required')),
  v.minLength(5, () => t('form.validation.subject.min', { min: 5 })),
  v.maxLength(100, () => t('form.validation.subject.max', { max: 100 })),
)

/**
 * An e-mail address, given out trimmed and in lower case. `fieldName` is the label of the
 * field, which its sentences name.
 */
export function emailFieldSchema(fieldName: string) {
  return v.pipe(
    // shared's `emailSchema` step by step: its own sentence is English and cannot be replaced
    v.string(),
    v.trim(),
    v.toLowerCase(),
    v.nonEmpty(() => t('form.validation.requiredField', { fieldName })),
    v.rfcEmail(() => t('form.validation.email', { fieldName })),
  )
}

/**
 * A password an account is given: every rule it breaks has a sentence of its own, and the
 * field lists them all.
 */
export const newPasswordSchema = v.pipe(
  v.string(),
  v.regex(/[a-z]/, () => t('site.signup.lowercase')),
  v.regex(/[A-Z]/, () => t('site.signup.uppercase')),
  v.regex(/[0-9]/, () => t('site.signup.one_number')),
  v.minLength(8, () => t('site.signup.minimum')),
  v.regex(/[^a-zA-Z0-9 \t\n\r]/, () => t('site.signup.special-char')),
  v.regex(/^[^ \t\n\r]*$/, () => t('site.signup.no-whitespace')),
)
