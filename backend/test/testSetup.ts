// eslint-disable-next-line import/no-unassigned-import
import 'openai/shims/node'
import { CONFIG } from '@/config'
import { i18n } from '@/server/localization'
import { backendLogger as logger } from '@/server/logger'

CONFIG.EMAIL = true
CONFIG.EMAIL_TEST_MODUS = false
CONFIG.HUMHUB_ACTIVE = false
CONFIG.GMS_ACTIVE = false

jest.setTimeout(1000000)

jest.mock('@/server/logger', () => {
  const originalModule = jest.requireActual<typeof logger>('@/server/logger')
  return {
    __esModule: true,
    ...originalModule,
    backendLogger: {
      addContext: jest.fn(),
      trace: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
    },
  }
})

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

export { logger, i18n }
