import { defaultCategory, initLogger } from 'config-schema'
import { CONFIG } from '@/config'

export function initLogging() {
  // init logger
  initLogger(
    [
      defaultCategory('backend', CONFIG.LOG_LEVEL),
      // A line for every request: in apollo.log, and only what went wrong on stdout.
      { ...defaultCategory('apollo', CONFIG.LOG_LEVEL), stdoutLevel: 'warn' },
      defaultCategory('klicktipp', CONFIG.LOG_LEVEL),
      defaultCategory('gms', CONFIG.LOG_LEVEL),
      defaultCategory('seed', CONFIG.LOG_LEVEL),
    ],
    CONFIG.LOG_FILES_BASE_PATH,
    CONFIG.LOG4JS_CONFIG,
  )
}
