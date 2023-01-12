import log4js from 'log4js'
import CONFIG from '@/config'

import { readFileSync } from 'fs'

const options = JSON.parse(readFileSync(CONFIG.LOG4JS_CONFIG, 'utf-8'))

options.categories.dht.level = CONFIG.LOG_LEVEL
options.categories.apollo.level = CONFIG.LOG_LEVEL
let filename: string = options.appenders.dht.filename
options.appenders.dht.filename = filename
  .replace('apiversion-%v', 'dht-' + CONFIG.FEDERATION_DHT_TOPIC)
  .replace('%p', CONFIG.PORT.toString())
filename = options.appenders.access.filename
options.appenders.access.filename = filename.replace('%p', CONFIG.PORT.toString())
filename = options.appenders.apollo.filename
options.appenders.apollo.filename = filename.replace('%p', CONFIG.PORT.toString())
filename = options.appenders.errorFile.filename
options.appenders.errorFile.filename = filename.replace('%p', CONFIG.PORT.toString())

log4js.configure(options)

const apolloLogger = log4js.getLogger('apollo')
const logger = log4js.getLogger('dht')

// backendLogger.addContext('user', 'unknown')

export { apolloLogger, logger }
