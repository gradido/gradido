import log4js from 'log4js'
import CONFIG from '@/config'

import { readFileSync } from 'fs'

const options = JSON.parse(readFileSync(CONFIG.LOG4JS_CONFIG, 'utf-8'))

options.categories.default.level = CONFIG.LOG_LEVEL

log4js.configure(options)

const apolloLogger = log4js.getLogger('apollo')
const backendLogger = log4js.getLogger('backend')

backendLogger.addContext('user', 'unknown')

export { apolloLogger, backendLogger }
