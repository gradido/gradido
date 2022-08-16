import log4js from 'log4js'
import CONFIG from '@/config'

import { readFileSync } from 'fs'

const options = JSON.parse(readFileSync(CONFIG.LOG4JS_CONFIG, 'utf-8'))

options.categories.backend.level = CONFIG.LOG_LEVEL
options.categories.apollo.level = CONFIG.LOG_LEVEL

log4js.configure(options)

const apolloLogger = log4js.getLogger('apollo')
const backendLogger = log4js.getLogger('backend')
const klickTippLogger = log4js.getLogger('klicktipp')

backendLogger.addContext('user', 'unknown')

export { apolloLogger, backendLogger, klickTippLogger }
