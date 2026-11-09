// AI-GENERATED — not an architecture reference

import de from '@admin/locales/de.json'
import el from '@admin/locales/el.json'
import en from '@admin/locales/en.json'
import es from '@admin/locales/es.json'
import fr from '@admin/locales/fr.json'
import it from '@admin/locales/it.json'
import nl from '@admin/locales/nl.json'
import pt from '@admin/locales/pt.json'
import ru from '@admin/locales/ru.json'
import tr from '@admin/locales/tr.json'
import { formatDistanceToNow, type Locale } from 'date-fns'
import {
  de as deDates,
  enUS as enDates,
  es as esDates,
  fr as frDates,
  nl as nlDates,
} from 'date-fns/locale'

type Messages = { [key: string]: string | Messages }

const messages: Record<string, Messages> = { de, el, en, es, fr, it, nl, pt, ru, tr }

let locale = 'en'

/** The language shown. */
export const currentLocale = () => locale

/** Switches the language; one the admin has no messages for stays English, as before. */
export const setLocale = (language: string) => {
  locale = language in messages ? language : 'en'
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

// the languages date-fns words a distance in; the others read it in English, as before
const DATE_LOCALES: Record<string, Locale> = {
  de: deDates,
  en: enDates,
  es: esDates,
  fr: frDates,
  nl: nlDates,
}

/** How long ago `date` was, in words of the current language: "vor 2 Tagen". */
export const distanceToNow = (date: Date) =>
  formatDistanceToNow(date, { addSuffix: true, locale: DATE_LOCALES[locale] ?? enDates })
