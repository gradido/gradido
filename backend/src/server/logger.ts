import log4js, { Logger } from 'log4js'
import CONFIG from '@/config'

import { readFileSync } from 'fs'

const options = JSON.parse(readFileSync(CONFIG.LOG4JS_CONFIG, 'utf-8'))

options.categories.default.level = CONFIG.LOG_LEVEL

log4js.configure(options)

export const getLogger = (name: string): Logger => {
  return log4js.getLogger(name)
}

export default log4js
