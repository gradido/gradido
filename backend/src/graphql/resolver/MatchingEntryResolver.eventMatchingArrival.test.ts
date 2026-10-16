// AI-GENERATED — not an architecture reference
import {
  User as DbUser,
  dbDeleteEventMatchingArrival,
  dbSelectEventMatchingArrival,
  dbSelectMatchingEntryByUuid,
} from 'database'
import { Context, newRequestBudget } from '@/server/context'
import { MatchingEntryResolver } from './MatchingEntryResolver'

// What the database answers is mocked here: the subject is what the resolver decides itself --
// whose arrival it reads, and that it only ever names the caller's OWN entry. The queries
// themselves are held by eventMatchingArrivals.test.ts, the whole way through the confirmation
// by MatchingEntryResolver.test.ts and UserResolver.test.ts.
jest.mock('database', () => {
  const originalModule = jest.requireActual('database')
  return {
    __esModule: true,
    ...originalModule,
    dbSelectEventMatchingArrival: jest.fn(),
    dbSelectMatchingEntryByUuid: jest.fn(),
    dbDeleteEventMatchingArrival: jest.fn(),
  }
})

const arrivalMock = dbSelectEventMatchingArrival as jest.Mock
const entryMock = dbSelectMatchingEntryByUuid as jest.Mock
const deleteMock = dbDeleteEventMatchingArrival as jest.Mock

const MAREN = 17
const JONAS = 18
const ENTRY = '4a7f3c2e-9b1d-4e8a-a6f0-1c2d3e4f5a6b'

const requestOf = (id: number): Context =>
  ({ user: { id } as DbUser, requestBudget: newRequestBudget() }) as unknown as Context

const entryOf = (userId: number, summary = 'Kongress Frequency Healing') => ({
  success: true,
  value: { id: 3, uuid: ENTRY, userId, matchingType: 'interest', summary },
})

beforeEach(() => {
  jest.clearAllMocks()
  arrivalMock.mockResolvedValue({ id: 1, userId: MAREN, matchingEntryUuid: ENTRY })
  entryMock.mockResolvedValue(entryOf(MAREN))
  deleteMock.mockResolvedValue(undefined)
})

describe('MatchingEntryResolver.eventMatchingArrival', () => {
  it("reads the arrival of the caller's account, and the entry it names", async () => {
    const answer = await new MatchingEntryResolver().eventMatchingArrival(requestOf(MAREN))

    expect(answer).toBe('Kongress Frequency Healing')
    expect(arrivalMock).toHaveBeenCalledWith(MAREN)
    expect(entryMock).toHaveBeenCalledWith(ENTRY)
  })

  it('answers null, and reads no entry, where no invitation is due', async () => {
    arrivalMock.mockResolvedValue(undefined)

    expect(await new MatchingEntryResolver().eventMatchingArrival(requestOf(MAREN))).toBeNull()
    expect(entryMock).not.toHaveBeenCalled()
  })

  it('answers null where the entry is gone', async () => {
    entryMock.mockResolvedValue({ success: false, error: new Error('not found') })

    expect(await new MatchingEntryResolver().eventMatchingArrival(requestOf(MAREN))).toBeNull()
  })

  // ⛔ A row that pointed at somebody else's entry would hand out that member's words.
  it('never names an entry of another member, whatever the row points at', async () => {
    entryMock.mockResolvedValue(entryOf(JONAS, 'Jonas privat'))

    expect(await new MatchingEntryResolver().eventMatchingArrival(requestOf(MAREN))).toBeNull()
  })
})

describe('MatchingEntryResolver.settleEventMatchingArrival', () => {
  it("ends the invitation of the caller's account, and of nobody else", async () => {
    expect(await new MatchingEntryResolver().settleEventMatchingArrival(requestOf(MAREN))).toBe(
      true,
    )

    expect(deleteMock).toHaveBeenCalledTimes(1)
    expect(deleteMock).toHaveBeenCalledWith(MAREN)
  })
})
