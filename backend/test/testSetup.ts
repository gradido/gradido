import 'reflect-metadata'
import 'openai/shims/node'
import { CONFIG } from '@/config'
import { i18n } from '@/server/localization'
import { getLogger, printLogs, clearLogs } from 'config-schema/test/testSetup'

CONFIG.EMAIL = true
CONFIG.EMAIL_TEST_MODUS = false
CONFIG.HUMHUB_ACTIVE = false
CONFIG.GMS_ACTIVE = false

jest.setTimeout(1000000)

jest.mock('@/server/localization', () => {
  const originalModule = jest.requireActual<typeof i18n>('@/server/localization')
  return {
    __esModule: true,
    ...originalModule,
    i18n: {
      init: jest.fn(),
      // configure: jest.fn(),
      // __: jest.fn(),
      // setLocale: jest.fn(),
    },
  }
})

export { i18n, getLogger, printLogs, clearLogs as cleanLogs }
