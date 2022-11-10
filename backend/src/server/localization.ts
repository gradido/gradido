import path from 'path'
import { backendLogger } from './logger'
import i18n from 'i18n'

i18n.configure({
  locales: ['en', 'de'],
  defaultLocale: 'en',
  retryInDefaultLocale: false,
  directory: path.join(__dirname, '..', 'locales'),
  // autoReload: true, // if this is activated the seeding hangs at the very end
  updateFiles: false,
  objectNotation: true,
  logDebugFn: (msg) => backendLogger.debug(msg),
  logWarnFn: (msg) => backendLogger.info(msg),
  logErrorFn: (msg) => backendLogger.error(msg),
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
// Wolle: i18n.setLocale('en')

export { i18n }
