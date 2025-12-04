import en from './en.json'
import de from './de.json'
import { I18n } from 'i18n'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'

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
  locales: ['en', 'de'],
  defaultLocale: 'en',
  staticCatalog: { en: flatten(en), de: flatten(de) },
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

