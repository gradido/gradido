// AI-GENERATED — not an architecture reference
import { AppContext, ResourceExhausted } from 'shared'
import { fakeVerifyPassword } from './PasswordEncryptor'

// test/testSetup.ts initializes the app context at the minimal difficulty: idle, nothing queued

describe('fakeVerifyPassword', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('takes the time a real verification takes and resolves', async () => {
    const stats = AppContext.getInstance().getPasswordHashingStats()
    const before = Date.now()
    await expect(fakeVerifyPassword()).resolves.toBeUndefined()
    // what the threads measure, with a tenth of scatter and the timer's own slack
    expect(Date.now() - before).toBeLessThanOrEqual(
      Math.ceil((stats.expectedWaitMs + stats.averageDurationMs) * 1.1) + 50,
    )
  })

  it('fails the way a real verification fails while the hashing threads are saturated', async () => {
    jest
      .spyOn(AppContext.prototype, 'passwordHashingRefusalNow')
      .mockReturnValue(
        new ResourceExhausted(
          'PasswordHashingQueue',
          'AppContext.hashPassword',
          'Server is full, please try again in 10 minutes.',
        ),
      )
    await expect(fakeVerifyPassword()).rejects.toThrow(
      'Server is full, please try again in 10 minutes.',
    )
  })
})
