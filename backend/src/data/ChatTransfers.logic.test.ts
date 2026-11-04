// AI-GENERATED — not an architecture reference
import {
  personsWithOnlyTransfersUnread,
  transferPersonKey,
  unreadTransfersByPerson,
  unreadTransfersSummary,
} from './ChatTransfers.logic'

const HOME = '11111111-1111-4111-8111-111111111111'
const LENA = { communityUuid: HOME, gradidoId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }
const MAX = { communityUuid: HOME, gradidoId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }
const shouting = (pair: { communityUuid: string; gradidoId: string }) => ({
  communityUuid: pair.communityUuid.toUpperCase(),
  gradidoId: pair.gradidoId.toUpperCase(),
})

describe('transferPersonKey', () => {
  it('is one key for one person, however the pair is spelled', () => {
    expect(transferPersonKey(shouting(LENA))).toBe(transferPersonKey(LENA))
    expect(transferPersonKey(MAX)).not.toBe(transferPersonKey(LENA))
  })
})

describe('unreadTransfersByPerson', () => {
  it('takes one person spelled two ways together', () => {
    const byPerson = unreadTransfersByPerson([
      { ...LENA, count: 2, latestId: 40 },
      { ...shouting(LENA), count: 1, latestId: 55 },
      { ...MAX, count: 1, latestId: 12 },
    ])
    expect(byPerson.size).toBe(2)
    expect(byPerson.get(transferPersonKey(LENA))).toMatchObject({ count: 3, latestId: 55 })
    expect(byPerson.get(transferPersonKey(MAX))).toMatchObject({ count: 1, latestId: 12 })
  })

  it('is empty for nothing unread', () => {
    expect(unreadTransfersByPerson([]).size).toBe(0)
  })
})

describe('personsWithOnlyTransfersUnread', () => {
  const transfers = unreadTransfersByPerson([
    { ...LENA, count: 1, latestId: 40 },
    { ...MAX, count: 2, latestId: 50 },
  ])

  // Lena's conversation counts her already; Max's transfers stand alone.
  it('counts a person whose message waits as well only once', () => {
    expect(personsWithOnlyTransfersUnread(transfers, [LENA])).toBe(1)
  })

  it('counts every person with a transfer where no conversation does', () => {
    expect(personsWithOnlyTransfersUnread(transfers, [])).toBe(2)
  })

  it('knows a person the conversation names in capitals', () => {
    expect(personsWithOnlyTransfersUnread(transfers, [shouting(LENA), shouting(MAX)])).toBe(0)
  })
})

describe('unreadTransfersSummary', () => {
  it('counts them all and names the newest', () => {
    expect(
      unreadTransfersSummary(
        unreadTransfersByPerson([
          { ...LENA, count: 1, latestId: 40 },
          { ...MAX, count: 2, latestId: 50 },
        ]),
      ),
    ).toEqual({ count: 3, latestId: 50 })
  })

  it('says none for nothing unread', () => {
    expect(unreadTransfersSummary(new Map())).toEqual({ count: 0, latestId: null })
  })
})
