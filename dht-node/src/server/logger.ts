import log4js from 'log4js'
import CONFIG from '@/config'

import { readFileSync } from 'fs'

const options = JSON.parse(readFileSync(CONFIG.LOG4JS_CONFIG, 'utf-8'))

options.categories.dht.level = CONFIG.LOG_LEVEL
let filename: string = options.appenders.dht.filename
options.appenders.dht.filename = filename.replace(
  'apiversion-%v',
  'dht-' + CONFIG.FEDERATION_DHT_TOPIC,
)
filename = options.appenders.errorFile.filename

log4js.configure(options)

const logger = log4js.getLogger('dht')

export { logger }
