import de from './de.json'
import el from './el.json'
import en from './en.json'
import es from './es.json'
import fr from './fr.json'
import it from './it.json'
import nl from './nl.json'
import pt from './pt.json'
import ru from './ru.json'
import tr from './tr.json'

type Catalog = Record<string, string>

/** `{ emails: { general: { helloName: '…' } } }` → `{ 'emails.general.helloName': '…' }` */
function flatten(node: Record<string, unknown>, prefix = ''): Catalog {
  const result: Catalog = {}
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'object' && value !== null) {
      Object.assign(result, flatten(value as Record<string, unknown>, `${prefix}${key}.`))
    } else {
      result[prefix + key] = String(value)
    }
  }
  return result
}

/** The ten languages core carries a catalog for - the languages of the wallet. */
export const locales = ['de', 'el', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'tr'] as const

const catalogs: Record<string, Catalog> = {
  de: flatten(de),
  el: flatten(el),
  en: flatten(en),
  es: flatten(es),
  fr: flatten(fr),
  it: flatten(it),
  nl: flatten(nl),
  pt: flatten(pt),
  ru: flatten(ru),
  tr: flatten(tr),
}

// The catalog text of one key in one locale, or in en if the locale is invalid or translation don't exit
// or key when that locale has no translation.
function translate(locale: string, key: string): string {
  if (!catalogs[locale] || !catalogs[locale][key]) {
    locale = 'en'
  }
  return catalogs[locale]?.[key] ?? key
}

/** Whether `locale` carries its own text for `key` - no fallback counted. */
export function hasPhraseInLocale(locale: string, key: string): boolean {
  return catalogs[locale]?.[key] !== undefined
}

/**
 * One phrase in one locale, each `{name}` filled with the value as it is. For the texts the
 * backend writes - a contribution memo, a thread message, the preview of a redeem link - and,
 * handed to the mail templates as `t`, for the mails.
 *
 * ⛔ Not HTML-escaped, on purpose. The `i18n` package this replaced rendered `{name}` through
 * Mustache's escaping form, which turned an apostrophe into `&#39;` and an ampersand into
 * `&amp;` - wrong for a memo, a thread message or a window text, all shown as plain text, and
 * wrong for the mails too: every template writes its text with `= t(…)` or `#{t(…)}`, and pug
 * escapes that once, so whatever a person typed was escaped TWICE - a moderator's
 * `https://gradido.net/faq` reached the member as `https:&#x2F;&#x2F;gradido.net&#x2F;faq`, and
 * a greeting read "Hallo Chloé D&#39;Angelo,". Whoever writes the text into a document
 * escapes it there (redeemPreview.ts does); never `!= t(…)` in a template.
 *
 * The filling is one pass over the phrase, so a value that contains `{name}` is inserted, not
 * filled again; a name the call does not hand over, or hands over as null or undefined,
 * becomes empty - what Mustache did. The phrases use nothing of Mustache but `{name}`; a test
 * holds all ten catalogs to that.
 *
 * Falls back to English when the phrase is not translated in the requested locale, so a
 * member whose language has not received the new keys yet reads a sentence rather than a
 * key; a key that exists nowhere comes back as the key.
 */
export function translateForLocale(
  locale: string,
  key: string,
  values: Record<string, unknown> = {},
): string {
  return translate(locale, key).replace(/\{(\w+)\}/g, (_placeholder, name: string) => {
    const value = values[name]
    return value === null || value === undefined ? '' : String(value)
  })
}
