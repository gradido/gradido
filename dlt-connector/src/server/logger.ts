import log4js from 'log4js'
import CONFIG from '@/config'

import { readFileSync } from 'fs'
const options = JSON.parse(readFileSync(CONFIG.LOG4JS_CONFIG, 'utf-8'))

log4js.configure(options)

const logger = log4js.getLogger('dlt-connector')

export { logger }
