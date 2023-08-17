import { logger } from '@/server/logger'

jest.setTimeout(1000000)

jest.mock('@/server/logger', () => {
  const originalModule = jest.requireActual('@/server/logger')
  return {
    __esModule: true,
    ...originalModule,
    logger: {
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

export { logger }
