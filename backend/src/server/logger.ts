import log4js, { Logger } from 'log4js'
import CONFIG from '@/config'

log4js.configure(CONFIG.LOG4JS_CONFIG)

export const getLogger = (name: string): Logger => {
  return log4js.getLogger(name)
}

export default log4js
