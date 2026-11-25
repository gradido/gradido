import en from '@frontend/locales/en.json'
import { slavicPlural } from '@frontend/utils/pluralRules'

type Texts = { [key: string]: string | Texts }

/**
 * The languages of the wallet, each under its own name. English is bundled: it stands in for
 * whatever another language lacks. Every other language is fetched once it is chosen -- a visit
 * reads one, not all ten.
 */
export const LANGUAGES = {
  de: { name: 'Deutsch', fetch: () => import('@frontend/locales/de.json') },
  el: { name: 'Ελληνικά', fetch: () => import('@frontend/locales/el.json') },
  en: { name: 'English', fetch: async () => ({ default: en }) },
  es: { name: 'Español', fetch: () => import('@frontend/locales/es.json') },
  fr: { name: 'Français', fetch: () => import('@frontend/locales/fr.json') },
  it: { name: 'Italiano', fetch: () => import('@frontend/locales/it.json') },
  nl: { name: 'Nederlands', fetch: () => import('@frontend/locales/nl.json') },
  pt: { name: 'Português', fetch: () => import('@frontend/locales/pt.json') },
  ru: { name: 'Русский', fetch: () => import('@frontend/locales/ru.json') },
  tr: { name: 'Türkçe', fetch: () => import('@frontend/locales/tr.json') },
} satisfies Record<string, { name: string; fetch: () => Promise<{ default: Texts }> }>

export type Language = keyof typeof LANGUAGES

/** The language shown. */
export let locale: Language = 'en'
let texts: Texts = en

/**
 * Shows the wallet in `language` once its texts are here: of what the browser names
 * (`de-AT`), its language (`de`). One the wallet does not speak, or whose texts cannot be
 * fetched, is English.
 */
export async function setLocale(language: string) {
  const code = language.split('-')[0]
  const known = code in LANGUAGES ? (code as Language) : 'en'
  const fetched = await LANGUAGES[known].fetch().catch(() => undefined)
  locale = fetched ? known : 'en'
  texts = fetched?.default ?? en
}

function textOf(all: Texts, key: string) {
  let found: string | Texts | undefined = all
  for (const part of key.split('.')) {
    found = typeof found === 'object' ? found[part] : undefined
  }
  return typeof found === 'string' ? found : undefined
}

// Which form of `one | many` or `none | one | many` stands for a count, by vue-i18n's rule,
// which the texts are written for. Russian has its own (three classes of numbers).
function pluralDefault(count: number, forms: number) {
  if (forms === 2) {
    return count === 0 || count > 1 ? 1 : 0
  }
  return Math.min(count, 2)
}

/**
 * The text of `key` in the language shown, in English where that one has none, and the key
 * itself where neither has it. `{name}` is filled from `values`; one without a value stays as it
 * is written, to be seen. A text with forms (`one | many`) gives the form for `count`, which
 * also fills `{n}` and `{count}`; without a count, the form for one.
 */
export function t(key: string, values: Record<string, string | number> = {}, count?: number) {
  const forms = (textOf(texts, key) ?? textOf(en, key) ?? key).split('|')
  const pluralRule = locale === 'ru' ? slavicPlural : pluralDefault
  const filled = { n: count, count, ...values }
  return forms[forms.length > 1 ? pluralRule(Math.abs(count ?? 1), forms.length) : 0]
    .trim()
    .replace(/\{\s*(\w+)\s*\}/g, (placeholder, name: keyof typeof filled) =>
      filled[name] === undefined ? placeholder : String(filled[name]),
    )
}

// The same fields in every language; their order Intl takes from the language.
const DATE_FORMATS = {
  short: { year: 'numeric', month: 'numeric', day: 'numeric' },
  long: { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' },
  monthShort: { month: 'short' },
  month: { month: 'long' },
  year: { year: 'numeric' },
  monthAndYear: { year: 'numeric', month: 'long' },
  time: { hour: 'numeric', minute: 'numeric' },
} satisfies Record<string, Intl.DateTimeFormatOptions>

/** `date` in the language shown, in one of the wallet's formats. */
export function d(date: Date, format: keyof typeof DATE_FORMATS) {
  return new Intl.DateTimeFormat(locale, DATE_FORMATS[format]).format(date)
}

const NUMBER_FORMATS = {
  decimal: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  ungroupedDecimal: { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false },
} satisfies Record<string, Intl.NumberFormatOptions>

/** `value` in the language shown: as it comes, or with two places (the sums of GDD). */
export function n(value: number, format?: keyof typeof NUMBER_FORMATS) {
  return new Intl.NumberFormat(locale, format && NUMBER_FORMATS[format]).format(value)
}
