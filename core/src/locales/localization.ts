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
 * One phrase in one locale, without touching the global locale.
 *
 * The mail path calls `i18n.setLocale` before rendering a template; a message that is
 * composed in code for one member must not do that, because the process serves everybody
 * at once. `__` with an explicit `locale` reads the catalog directly.
 *
 * Falls back to English when the phrase is not translated in the requested locale
 * (i18n answers the key itself in that case), so a member whose language has not received
 * the new keys yet reads a sentence rather than a key.
 */
export function translateForLocale(
  locale: string,
  key: string,
  replacements: Record<string, string> = {},
): string {
  const translated = i18n.__({ phrase: key, locale }, replacements)
  if (translated !== key || locale === 'en') {
    return translated
  }
  return i18n.__({ phrase: key, locale: 'en' }, replacements)
}
