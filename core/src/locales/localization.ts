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
