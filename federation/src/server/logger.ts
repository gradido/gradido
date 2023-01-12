import log4js from 'log4js'
import CONFIG from '@/config'

import { readFileSync } from 'fs'

const options = JSON.parse(readFileSync(CONFIG.LOG4JS_CONFIG, 'utf-8'))

options.categories.backend.level = CONFIG.LOG_LEVEL
options.categories.apollo.level = CONFIG.LOG_LEVEL
let filename: string = options.appenders.federation.filename
options.appenders.federation.filename = filename
  .replace('%v', CONFIG.FEDERATION_API)
  .replace('%p', CONFIG.FEDERATION_PORT.toString())
filename = options.appenders.access.filename
options.appenders.access.filename = filename.replace(
  '%p',
  CONFIG.FEDERATION_PORT.toString()
)
filename = options.appenders.apollo.filename
options.appenders.apollo.filename = filename.replace(
  '%p',
  CONFIG.FEDERATION_PORT.toString()
)
filename = options.appenders.backend.filename
options.appenders.backend.filename = filename.replace(
  '%p',
  CONFIG.FEDERATION_PORT.toString()
)
filename = options.appenders.errorFile.filename
options.appenders.errorFile.filename = filename.replace(
  '%p',
  CONFIG.FEDERATION_PORT.toString()
)

log4js.configure(options)

const apolloLogger = log4js.getLogger('apollo')
// const backendLogger = log4js.getLogger('backend')
const federationLogger = log4js.getLogger('federation')

// backendLogger.addContext('user', 'unknown')

export { apolloLogger, federationLogger }
