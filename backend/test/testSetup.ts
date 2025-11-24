import 'openai/shims/node'
import { CONFIG } from '@/config'
import { CONFIG as CORE_CONFIG } from 'core'
import { getLogger, printLogs, clearLogs } from 'config-schema/test/testSetup'

CORE_CONFIG.EMAIL = true
CORE_CONFIG.EMAIL_TEST_MODUS = false
CONFIG.HUMHUB_ACTIVE = false
CONFIG.GMS_ACTIVE = false

jest.setTimeout(1000000)

export { getLogger, printLogs, clearLogs as cleanLogs }
