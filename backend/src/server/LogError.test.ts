import { getLogger } from 'config-schema/test/testSetup'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

import { LogError } from './LogError'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

describe('LogError', () => {
  it('logs an Error when created', () => {
    new LogError('new LogError')
    expect(logger.error).toBeCalledWith('new LogError')
  })

  it('logs an Error including additional data when created', () => {
    new LogError('new LogError', { some: 'data' })
    expect(logger.error).toBeCalledWith('new LogError', { some: 'data' })
  })

  it('does not contain additional data in Error object when thrown', () => {
    try {
      throw new LogError('new LogError', { someWeirdValue123: 'arbitraryData456' })
    } catch (e: any) {
      expect(e.stack).not.toMatch(/(someWeirdValue123|arbitraryData456)/i)
    }
  })
})
