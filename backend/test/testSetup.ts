import { backendLogger as logger } from '@/server/logger'
import { i18n } from '@/server/localization'

jest.setTimeout(1000000)

jest.mock('@/server/logger', () => {
  const originalModule = jest.requireActual('@/server/logger')
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
  const originalModule = jest.requireActual('@/server/localization')
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
