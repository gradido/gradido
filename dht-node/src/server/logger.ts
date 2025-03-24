/* eslint-disable n/no-sync */
import { readFileSync } from 'fs'

import { configure, getLogger } from 'log4js'

import { CONFIG } from '@/config'

const options = JSON.parse(readFileSync(CONFIG.LOG4JS_CONFIG, 'utf-8'))

options.categories.dht.level = CONFIG.LOG_LEVEL
let filename: string = options.appenders.dht.filename
options.appenders.dht.filename = filename.replace(
  'apiversion-%v',
  'dht-' + CONFIG.FEDERATION_DHT_TOPIC,
)
filename = options.appenders.errorFile.filename

configure(options)

const logger = getLogger('dht')

export { logger }
