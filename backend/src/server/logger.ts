/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { readFileSync } from 'fs'

import { configure, getLogger } from 'log4js'

import CONFIG from '@/config'

const options = JSON.parse(readFileSync(CONFIG.LOG4JS_CONFIG, 'utf-8'))

options.categories.backend.level = CONFIG.LOG_LEVEL
options.categories.apollo.level = CONFIG.LOG_LEVEL

configure(options)

const apolloLogger = getLogger('apollo')
const backendLogger = getLogger('backend')
const klickTippLogger = getLogger('klicktipp')

backendLogger.addContext('user', 'unknown')

export { apolloLogger, backendLogger, klickTippLogger }
