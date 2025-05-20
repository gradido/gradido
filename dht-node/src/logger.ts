import { readFileSync } from 'node:fs'
import { configure, getLogger } from 'log4js'
import { createLog4jsConfig } from 'config-schema'
import { CONFIG } from './config'

// TODO: check for file, else use generator
const options = JSON.parse(readFileSync(CONFIG.LOG4JS_CONFIG, 'utf-8'))

options.categories.dht.level = CONFIG.LOG_LEVEL
let filename: string = options.appenders.dht.filename
options.appenders.dht.filename = filename.replace(
  'apiversion-%v',
  'dht-' + CONFIG.FEDERATION_DHT_TOPIC,
)
filename = options.appenders.errorFile.filename

configure(createLog4jsConfig([
  { name: 'dht', level: CONFIG.LOG_LEVEL, stdout: true, errors: true },
], CONFIG.LOG_BASE_PATH + '/dht-node'))

const logger = getLogger('dht')

export { logger }
