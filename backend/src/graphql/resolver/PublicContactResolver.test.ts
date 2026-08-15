// AI-GENERATED — not an architecture reference
import { PublicContactArgs } from '@arg/PublicContactArgs'
import { sendContactFromProfileEmail } from 'core'
import { findUserByIdentifier, getHomeCommunity } from 'database'
import { Context } from '@/server/context'
import { PublicContactResolver } from './PublicContactResolver'

jest.mock('core', () => ({
  sendContactFromProfileEmail: jest.fn(),
}))

jest.mock('database', () => ({
  findUserByIdentifier: jest.fn(),
  getHomeCommunity: jest.fn(),
}))

const mockedSend = sendContactFromProfileEmail as jest.Mock
const mockedFind = findUserByIdentifier as jest.Mock
const mockedHome = getHomeCommunity as jest.Mock

// The delivery deliberately happens after the answer, so a test has to let the event loop
// come round before it can see whether anything was sent.
const afterTheAnswer = async (): Promise<void> => {
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => setImmediate(resolve))
  }
}

const member = {
  firstName: 'Bibi',
  lastName: 'Bloxberg',
  language: 'de',
  foreign: false,
  emailContact: { email: 'bibi@bloxberg.de' },
}

const argsFor = (overrides: Partial<PublicContactArgs> = {}): PublicContactArgs =>
  ({
    recipientIdentifier: 'Bibi',
    senderName: 'Ein Fremder',
    senderEmail: 'stranger@example.org',
    subject: 'Hallo',
    message: 'Wir haben uns gestern getroffen.',
    ...overrides,
  }) as PublicContactArgs

describe('PublicContactResolver', () => {
  let resolver: PublicContactResolver
  let context: Context

  beforeEach(() => {
    jest.clearAllMocks()
    mockedHome.mockResolvedValue({ communityUuid: 'community-uuid' })
    mockedFind.mockResolvedValue(member)
    resolver = new PublicContactResolver()
    // a fresh origin per test, so the rate limit of one test cannot reach into the next
    context = { token: null, setHeaders: [], clientIp: `10.0.0.${Math.random()}` }
  })

  describe('a message to a member', () => {
    it('is handed over to the mail path', async () => {
      resolver.sendPublicContactMessage(argsFor(), context)
      await afterTheAnswer()
      expect(mockedSend).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'bibi@bloxberg.de',
          senderName: 'Ein Fremder',
          senderEmail: 'stranger@example.org',
          subject: 'Hallo',
          message: 'Wir haben uns gestern getroffen.',
        }),
      )
    })

    it('is answered before anybody has been looked up', () => {
      const answer = resolver.sendPublicContactMessage(argsFor(), context)
      expect(answer).toBe(true)
      // The first of these is the sharp one. An async function still runs its own beginning
      // synchronously, so handing the delivery off without waiting for it is not enough --
      // everything up to the first `await` would happen inside the answer, and a caller with
      // a stopwatch could measure it. Only a delivery that starts after this turn of the
      // event loop leaves getHomeCommunity untouched at this moment.
      expect(mockedHome).not.toHaveBeenCalled()
      expect(mockedFind).not.toHaveBeenCalled()
      expect(mockedSend).not.toHaveBeenCalled()
    })
  })

  describe('a message to an alias nobody has', () => {
    it('is answered exactly like a message to a member, and sends nothing', async () => {
      mockedFind.mockResolvedValue(null)
      const answer = resolver.sendPublicContactMessage(
        argsFor({ recipientIdentifier: 'Xyzabc' }),
        context,
      )
      await afterTheAnswer()
      expect(answer).toBe(true)
      expect(mockedSend).not.toHaveBeenCalled()
    })
  })

  describe('an e-mail address instead of an alias', () => {
    it('never reaches the database', async () => {
      resolver.sendPublicContactMessage(
        argsFor({ recipientIdentifier: 'somebody@example.com' }),
        context,
      )
      await afterTheAnswer()
      // not "finds nobody" but "does not even ask": otherwise the form would deliver mail to
      // any address a stranger already holds, and would answer whether it is a member's
      expect(mockedFind).not.toHaveBeenCalled()
      expect(mockedSend).not.toHaveBeenCalled()
    })

    it('is answered like everything else', () => {
      expect(
        resolver.sendPublicContactMessage(
          argsFor({ recipientIdentifier: 'somebody@example.com' }),
          context,
        ),
      ).toBe(true)
    })
  })

  describe('a recipient who cannot be reached here', () => {
    it('gets no mail when the record is a foreign community s copy', async () => {
      mockedFind.mockResolvedValue({ ...member, foreign: true })
      resolver.sendPublicContactMessage(argsFor(), context)
      await afterTheAnswer()
      expect(mockedSend).not.toHaveBeenCalled()
    })

    it('gets no mail without an e-mail contact', async () => {
      mockedFind.mockResolvedValue({ ...member, emailContact: null })
      resolver.sendPublicContactMessage(argsFor(), context)
      await afterTheAnswer()
      expect(mockedSend).not.toHaveBeenCalled()
    })
  })

  describe('the honeypot', () => {
    it('swallows the message of whoever fills it in, with the same answer', async () => {
      const answer = resolver.sendPublicContactMessage(
        argsFor({ website: 'https://buy-now.example' }),
        context,
      )
      await afterTheAnswer()
      expect(answer).toBe(true)
      expect(mockedSend).not.toHaveBeenCalled()
    })
  })

  describe('an origin that writes too often', () => {
    it('is answered like everybody else and stops being delivered', async () => {
      const answers: boolean[] = []
      for (let i = 0; i < 4; i++) {
        answers.push(resolver.sendPublicContactMessage(argsFor(), context))
      }
      await afterTheAnswer()
      expect(answers).toEqual([true, true, true, true])
      expect(mockedSend).toHaveBeenCalledTimes(3)
    })
  })

  describe('a mail path that breaks', () => {
    it('is not visible to the sender', async () => {
      mockedSend.mockRejectedValue(new Error('smtp is down'))
      const answer = resolver.sendPublicContactMessage(argsFor(), context)
      await afterTheAnswer()
      expect(answer).toBe(true)
    })
  })
})
