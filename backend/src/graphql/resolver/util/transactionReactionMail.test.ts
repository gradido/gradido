// AI-GENERATED — not an architecture reference
import { getLogger } from 'config-schema/test/testSetup'
import { chatMailWentOut, readChatMemberMutedAt, sendTransactionReactionReceivedEmail } from 'core'
import { User as DbUser, dbFindDirectChatConversation, dbFindUserWithContactById } from 'database'
import { GradidoUnit } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { getCommunityName } from './communities'
import { notifyGiverOfReaction } from './transactionReactionMail'

// The giver, the conversation and the mail are mocked: the subject is what the delivery makes of
// them -- whom it loads, what it reads, what it hands the mail, and that nothing of it throws.
// The whole way, with a database, is held in TransactionReactionResolver.test.ts.
jest.mock('database', () => {
  const originalModule = jest.requireActual('database')
  return {
    __esModule: true,
    ...originalModule,
    dbFindUserWithContactById: jest.fn(),
    dbFindDirectChatConversation: jest.fn(),
  }
})
jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    readChatMemberMutedAt: jest.fn(),
    sendTransactionReactionReceivedEmail: jest.fn(),
  }
})
jest.mock('./communities', () => ({
  __esModule: true,
  getCommunityName: jest.fn(async () => 'KI Playground'),
}))

const HEART = '❤️'
const PAUL_ID = 23
const MUTED_AT = new Date('2026-10-20T10:00:00Z')

// Lena reacted to a transfer from Paul; both members here.
const lena = {
  id: 17,
  alias: 'lena',
  gradidoID: '3f9a1e2c-1111-4a2b-9c3d-0000000000ab',
  communityUuid: 'aaaa1111-2222-4333-8444-5555666677cd',
} as unknown as DbUser
const paul = {
  id: PAUL_ID,
  alias: 'paul',
  gradidoId: '5555eeee-1111-4a2b-9c3d-0000000000ff',
  communityUuid: lena.communityUuid,
  firstName: 'Paul',
  lastName: 'Lustig',
  language: 'de',
  emailContact: { email: 'paul@lustig.de' },
}
const received = {
  id: 501,
  senderIsMemberHere: true,
  senderUserId: PAUL_ID,
  amount: GradidoUnit.fromNumber(5),
  memo: 'Für das Brot',
}
const first = { recipientUser: lena, received, emoji: HEART, hadReaction: false }

const giver = dbFindUserWithContactById as jest.Mock
const conversation = dbFindDirectChatConversation as jest.Mock
const mutedAt = readChatMemberMutedAt as jest.Mock
const mail = sendTransactionReactionReceivedEmail as jest.Mock
const logger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.transactionReactionMail`,
)

const nothingLoaded = () => {
  expect(giver).not.toHaveBeenCalled()
  expect(conversation).not.toHaveBeenCalled()
  expect(mutedAt).not.toHaveBeenCalled()
  expect(mail).not.toHaveBeenCalled()
}

beforeEach(() => {
  jest.clearAllMocks()
  giver.mockResolvedValue(paul)
  // The two have no conversation yet.
  conversation.mockResolvedValue(null)
  mutedAt.mockResolvedValue(null)
  mail.mockResolvedValue({ accepted: ['watched'] })
})

describe('notifyGiverOfReaction, a first reaction', () => {
  it("mails the giver, with the recipient's alias and community, the emoji, the amount, the memo and the way into the conversation", async () => {
    expect(await notifyGiverOfReaction(first)).toBe('MAIL')

    expect(giver.mock.calls).toEqual([[PAUL_ID]])
    expect(getCommunityName).toHaveBeenCalledWith(lena.communityUuid)
    expect(mail.mock.calls).toEqual([
      [
        {
          firstName: 'Paul',
          lastName: 'Lustig',
          email: 'paul@lustig.de',
          language: 'de',
          recipientAlias: 'lena',
          recipientCommunity: 'KI Playground',
          emoji: HEART,
          transactionAmount: GradidoUnit.fromNumber(5),
          transactionMemo: 'Für das Brot',
          recipientUuid: lena.gradidoID,
          recipientCommunityUuid: lena.communityUuid,
        },
      ],
    ])
    expect((logger.info as jest.Mock).mock.calls).toEqual([
      ['transaction reaction mail sent: transaction_id=501'],
    ])
  })

  it('gives a giver without names the mail all the same', async () => {
    giver.mockResolvedValue({ ...paul, firstName: null, lastName: null })

    expect(await notifyGiverOfReaction(first)).toBe('MAIL')

    expect(mail.mock.calls[0][0]).toMatchObject({ firstName: '', lastName: '' })
  })

  // Where the two have a conversation, the giver's own mark on it decides (E-024).
  it('reads the mute mark of the giver on the conversation of the two, and mails where there is none', async () => {
    conversation.mockResolvedValue({ id: 88 })

    expect(await notifyGiverOfReaction(first)).toBe('MAIL')

    expect(conversation.mock.calls).toEqual([
      [
        { communityUuid: paul.communityUuid, gradidoId: paul.gradidoId },
        { communityUuid: lena.communityUuid, gradidoId: lena.gradidoID },
      ],
    ])
    expect(mutedAt.mock.calls).toEqual([
      [88, { communityUuid: paul.communityUuid, gradidoId: paul.gradidoId }],
    ])
  })

  it('mails nothing where the giver muted the conversation, and says so', async () => {
    conversation.mockResolvedValue({ id: 88 })
    mutedAt.mockResolvedValue(MUTED_AT)

    expect(await notifyGiverOfReaction(first)).toBe('MUTED')

    expect(mail).not.toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith(
      'transaction reaction mail not sent: transaction_id=501 MUTED',
    )
  })

  // null for a giver without an address row, and for one who left.
  it('mails nothing where the giver has no address, and says so', async () => {
    giver.mockResolvedValue(null)

    expect(await notifyGiverOfReaction(first)).toBe('NO_ADDRESS')

    expect(conversation).not.toHaveBeenCalled()
    expect(mail).not.toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith(
      'transaction reaction mail not sent: transaction_id=501 NO_ADDRESS',
    )
  })
})

describe('notifyGiverOfReaction, what reads nothing', () => {
  it('a reaction taken back', async () => {
    expect(await notifyGiverOfReaction({ ...first, emoji: null, hadReaction: true })).toBe(
      'TAKEN_BACK',
    )
    expect(await notifyGiverOfReaction({ ...first, emoji: null, hadReaction: false })).toBe(
      'TAKEN_BACK',
    )

    nothingLoaded()
  })

  it('another emoji in the place of the one before', async () => {
    expect(await notifyGiverOfReaction({ ...first, hadReaction: true })).toBe('NOT_THE_FIRST')

    nothingLoaded()
  })

  // A transfer booked here names its giver and its amount; a row this server did not write
  // is said, not mailed about.
  it('a booking that names no giver, or no amount', async () => {
    expect(
      await notifyGiverOfReaction({ ...first, received: { ...received, senderUserId: null } }),
    ).toBe('NO_GIVER')
    expect(await notifyGiverOfReaction({ ...first, received: { ...received, amount: null } })).toBe(
      'NO_GIVER',
    )

    nothingLoaded()
    expect(logger.warn).toHaveBeenCalledTimes(2)
  })
})

/**
 * ⛔ Never throws, and the answer is the same whatever the mail did: the reaction is stored
 * before this runs, and the mutation answers the emoji.
 */
describe('notifyGiverOfReaction, where the mail does not go out', () => {
  it.each([
    ['mail is switched off on this server', null],
    ['the transport refused it', false],
    ['the transport answered an error', new Error('smtp down')],
  ])('says NOT_SENT where %s', async (_what, answer) => {
    mail.mockResolvedValue(answer)

    expect(await notifyGiverOfReaction(first)).toBe('NOT_SENT')

    expect(chatMailWentOut(answer)).toBe(false)
    expect(logger.warn).toHaveBeenCalledWith(
      'transaction reaction mail not sent: transaction_id=501 NOT_SENT',
    )
  })

  it.each([
    ['the giver cannot be loaded', () => giver.mockRejectedValue(new Error('db gone'))],
    ['the conversation cannot be read', () => conversation.mockRejectedValue(new Error('db gone'))],
    ['the mail throws', () => mail.mockRejectedValue(new Error('smtp down'))],
  ])('throws nothing where %s, and writes the error to the log', async (_what, fail) => {
    fail()

    await expect(notifyGiverOfReaction(first)).resolves.toBe('NOT_SENT')

    expect(logger.error).toHaveBeenCalledWith(
      'transaction reaction mail failed: transaction_id=501',
      expect.any(Error),
    )
  })

  // The emoji is never written to the log, whatever happened.
  it('never writes the emoji into the log', async () => {
    mail.mockRejectedValue(new Error('smtp down'))
    await notifyGiverOfReaction(first)
    conversation.mockResolvedValue({ id: 88 })
    mutedAt.mockResolvedValue(MUTED_AT)
    await notifyGiverOfReaction(first)

    const lines = ['info', 'warn', 'error', 'debug']
      .flatMap((level) => (logger[level as 'info'] as jest.Mock).mock.calls)
      .map((args) => args.map(String).join(' '))
      .join('\n')
    expect(lines).not.toContain('❤')
    expect(lines).not.toContain('paul@lustig.de')
  })
})
