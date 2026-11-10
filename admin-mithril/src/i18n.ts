// AI-GENERATED — not an architecture reference

import en from '@admin/locales/en.json'
import { timeAgo } from '@/data/RelativeTime.logic'

type Messages = { [key: string]: string | Messages }

// English is always here: it stands in for whatever another language lacks. Every other language
// is fetched once it is chosen -- a session reads one, not all ten.
const LANGUAGES: Record<string, () => Promise<{ default: Messages }>> = {
  de: () => import('@admin/locales/de.json'),
  el: () => import('@admin/locales/el.json'),
  en: async () => ({ default: en }),
  es: () => import('@admin/locales/es.json'),
  fr: () => import('@admin/locales/fr.json'),
  it: () => import('@admin/locales/it.json'),
  nl: () => import('@admin/locales/nl.json'),
  pt: () => import('@admin/locales/pt.json'),
  ru: () => import('@admin/locales/ru.json'),
  tr: () => import('@admin/locales/tr.json'),
}

const messages: Record<string, Messages> = { en }
let locale = 'en'

/** The language shown. */
export const currentLocale = () => locale

/**
 * Switches the language, once its messages are fetched; one the admin has no messages for stays
 * English, as before -- and so does one that could not be fetched.
 */
export const setLocale = async (language: string) => {
  const words = await LANGUAGES[language]?.().catch(() => undefined)
  if (words) {
    messages[language] = words.default
  }
  locale = words ? language : 'en'
}

const lookup = (language: string, key: string) => {
  const found = key
    .split('.')
    .reduce<string | Messages | undefined>(
      (node, part) => (typeof node === 'object' ? node[part] : undefined),
      messages[language],
    )
  return typeof found === 'string' ? found : undefined
}

// Which of the forms of a message `a | b` or `a | b | c` stands for `count`, by vue-i18n's rule:
// of two, the first for one and the second for any other count; of three, 0, 1 and more.
const pluralForm = (message: string, count: number) => {
  const forms = message.split(' | ')
  const n = Math.abs(count)
  const index = forms.length === 2 ? (n === 1 ? 0 : 1) : Math.min(n, forms.length - 1)
  return forms[index]
}

/**
 * The message of `key` in the current language, English where it has none, the key itself where
 * neither has it (as vue-i18n did); `{name}` is filled from `values`. With `count`, the plural
 * form of a message `one | many` for it.
 */
export const t = (key: string, values: Record<string, string | number> = {}, count?: number) => {
  const message = lookup(locale, key) ?? lookup('en', key) ?? key
  return (count === undefined ? message : pluralForm(message, count)).replace(
    /\{(\w+)\}/g,
    (placeholder, name) => (name in values ? String(values[name]) : placeholder),
  )
}

// The date formats of the old admin (its `datetimeFormats`): the same fields in every language,
// whose order Intl takes from the language.
const DATE_FORMATS = {
  short: { year: 'numeric', month: 'numeric', day: 'numeric' },
  shortTime: {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  },
  long: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
  },
  monthShort: { month: 'short' },
  month: { month: 'long' },
  year: { year: 'numeric' },
} satisfies Record<string, Intl.DateTimeFormatOptions>

/**
 * `date` in the current language, in one of the old admin's formats -- `short`, the numbers of
 * day, month and year, where none is named, as there.
 */
export const d = (date: Date, format: keyof typeof DATE_FORMATS = 'short', language = locale) =>
  new Intl.DateTimeFormat(language, DATE_FORMATS[format]).format(date)

/**
 * `value` as a number in the current language: whole as it comes, `decimal` with two places (the
 * sums of GDD).
 */
export const n = (value: number, format?: 'decimal') =>
  new Intl.NumberFormat(
    locale,
    format === 'decimal' ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : {},
  ).format(value)

/**
 * How long ago `date` was, in words of the current language: "vor 2 Tagen". Intl knows all ten
 * languages; date-fns, which the old admin took, only five, and it said "etwa" and "fast" around
 * the number.
 */
export const distanceToNow = (date: Date) =>
  new Intl.RelativeTimeFormat(locale, { numeric: 'always' }).format(...timeAgo(date, new Date()))
