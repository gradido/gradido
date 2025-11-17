import { CONFIG } from '@/config'
import { defaultCategory, initLogger } from 'config-schema'

export function initLogging() {
  // init logger
  initLogger(
    [
      defaultCategory('backend', CONFIG.LOG_LEVEL),
      defaultCategory('database', CONFIG.LOG_LEVEL),
      defaultCategory('core', CONFIG.LOG_LEVEL),
      defaultCategory('shared', CONFIG.LOG_LEVEL),
      defaultCategory('apollo', CONFIG.LOG_LEVEL),
      defaultCategory('klicktipp', CONFIG.LOG_LEVEL),
      defaultCategory('gms', CONFIG.LOG_LEVEL),
      defaultCategory('seed', CONFIG.LOG_LEVEL),
    ],
    CONFIG.LOG_FILES_BASE_PATH,
    CONFIG.LOG4JS_CONFIG,
  )
}
