import path from 'node:path'
import i18n from 'i18n'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.localization`)

i18n.configure({
  locales: ['en', 'de'],
  defaultLocale: 'en',
  retryInDefaultLocale: false,
  directory: path.join(__dirname, '..', 'locales'),
  // autoReload: true, // if this is activated the seeding hangs at the very end
  updateFiles: false,
  objectNotation: true,
  logDebugFn: (msg) => logger.debug(msg),
  logWarnFn: (msg) => logger.info(msg),
  logErrorFn: (msg) => logger.error(msg),
  // this api is needed for email-template pug files
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

export { i18n }
