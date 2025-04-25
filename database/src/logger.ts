import { configure, getLogger } from 'log4js'

import { CONFIG } from './config'

import { createLog4jsConfig } from 'config-schema'

configure(createLog4jsConfig([
  { name: 'default', level: CONFIG.LOG_LEVEL, stdout: true, errors: true },
], CONFIG.LOG_BASE_PATH + '/database'))

export const logger = getLogger('default') 
