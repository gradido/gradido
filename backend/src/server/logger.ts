import log4js from 'log4js'
import CONFIG from '@/config'

log4js.configure(CONFIG.LOG4JS_CONFIG)

export default log4js
