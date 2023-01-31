import { logger } from '@test/testSetup'

import LogError from './LogError'

describe('LogError', () => {
  it('logs an Error when created', () => {
    /* eslint-disable-next-line no-new */
    new LogError('new LogError')
    expect(logger.error).toBeCalledWith('new LogError')
  })

  it('logs an Error including additional data when created', () => {
    /* eslint-disable-next-line no-new */
    new LogError('new LogError', { some: 'data' })
    expect(logger.error).toBeCalledWith('new LogError', { some: 'data' })
  })

  it('does not contain additional data in Error object when thrown', () => {
    try {
      throw new LogError('new LogError', { someWeirdValue123: 'arbitraryData456' })
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    } catch (e: any) {
      expect(e.stack).not.toMatch(/(someWeirdValue123|arbitraryData456)/i)
    }
  })
})
