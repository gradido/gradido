import { I18n } from 'i18n'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'
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

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.emails.localization`)

function flatten(obj: any, prefix: string = ''): any {
  const result: any = {}
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(result, flatten(obj[key], prefix + key + '.'))
    } else {
      result[prefix + key] = obj[key]
    }
  }
  return result
}

export const i18n = new I18n({
  locales: ['en', 'de', 'es', 'fr', 'nl', 'it', 'tr', 'ru', 'pt', 'el'],
  defaultLocale: 'en',
  staticCatalog: {
    en: flatten(en),
    de: flatten(de),
    es: flatten(es),
    fr: flatten(fr),
    nl: flatten(nl),
    it: flatten(it),
    tr: flatten(tr),
    ru: flatten(ru),
    pt: flatten(pt),
    el: flatten(el),
  },
  logDebugFn: (msg) => logger.debug(msg),
  logWarnFn: (msg) => logger.info(msg),
  logErrorFn: (msg) => logger.error(msg),
  api: {
    __: 't', // now req.__ becomes req.t
    __n: 'tn', // and req.__n can be called as req.tn
  },
  register: global,
  mustacheConfig: {
    tags: ['{', '}'],
    disable: false,
  },
})

/**
 * The catalog text of one key in one locale, or null when that locale has no translation.
 * Read off the static catalog rather than through `__`: this never moves the global locale
 * the mail path relies on, and it never runs Mustache.
 */
function phraseInLocale(locale: string, key: string): string | null {
  const catalog = i18n.getCatalog(locale) as Record<string, string> | undefined
  const phrase = catalog?.[key]
  return typeof phrase === 'string' ? phrase : null
}

/** Whether `locale` carries its own text for `key` - no fallback counted. */
export function hasPhraseInLocale(locale: string, key: string): boolean {
  return phraseInLocale(locale, key) !== null
}

/**
 * One phrase in one locale, with `{name}` placeholders filled by plain replacement.
 *
 * Plain replacement and NOT Mustache on purpose: i18n renders `{name}` through Mustache's
 * escaping form, which turns an apostrophe into `&#39;` and an ampersand into `&amp;` -
 * wrong for a contribution memo, a thread message or a window text, all of which are shown
 * as plain text, and wrong for the mails too, which escape once more themselves (see
 * `translateForMail`). The values here are inserted as they are.
 *
 * Falls back to English when the phrase is not translated in the requested locale, so a
 * member whose language has not received the new keys yet reads a sentence rather than a
 * key; a key that exists nowhere comes back as the key.
 */
export function translateForLocale(
  locale: string,
  key: string,
  replacements: Record<string, string> = {},
): string {
  const phrase = phraseInLocale(locale, key) ?? phraseInLocale('en', key) ?? key
  return Object.entries(replacements).reduce(
    (text, [name, value]) => text.split(`{${name}}`).join(value),
    phrase,
  )
}

/**
 * `t` for the mail templates (`sendEmailTranslated` hands it to them): the phrase in the
 * receiver's locale, each `{name}` filled with the value as it is.
 *
 * ⛔ Not HTML-escaped, and that is what makes the mails right: every template writes its text
 * with `= t(…)` or `#{t(…)}`, and pug escapes that once. i18n's `__` had escaped the values
 * through Mustache before that, so whatever a person typed was escaped TWICE - a moderator's
 * `https://gradido.net/faq` reached the member as `https:&#x2F;&#x2F;gradido.net&#x2F;faq`,
 * and a greeting read "Hallo Chloé D&#39;Angelo,". Never `!= t(…)` in a template: nothing
 * else escapes this text.
 *
 * What Mustache did besides stays: one pass, so a value that contains `{name}` is inserted,
 * not filled again; a name the call does not hand over, or hands over as null or undefined,
 * becomes empty. The mail phrases use nothing of Mustache but `{name}` - a test holds all ten
 * catalogs to that. A phrase a locale lacks falls back to English, as in `translateForLocale`.
 */
export function translateForMail(
  locale: string,
  key: string,
  values: Record<string, unknown> = {},
): string {
  const phrase = phraseInLocale(locale, key) ?? phraseInLocale('en', key) ?? key
  return phrase.replace(/\{(\w+)\}/g, (_placeholder, name: string) => {
    const value = values[name]
    return value === null || value === undefined ? '' : String(value)
  })
}
