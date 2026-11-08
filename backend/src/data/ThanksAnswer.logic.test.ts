// AI-GENERATED — not an architecture reference
import { TransactionTypeId } from 'database'
import {
  answeredOfBooking,
  BookingAnswerColumns,
  ThanksAnswers,
  thanksPartnerIdsOf,
} from './ThanksAnswer.logic'

const BIBI = 11
const PETER = 12
const BOB = 13
// A member of another community the federation stored a `users` row for: an id, and no member here.
const LOTTE = 77
const MEMBERS_HERE: ReadonlySet<number> = new Set([BIBI, PETER, BOB])

const CAME = new Date('2026-11-08T09:00:00.000Z')
const later = (ms: number) => new Date(CAME.getTime() + ms)

const booking = (
  id: number,
  typeId: TransactionTypeId,
  linkedUserId: number | null,
  balanceDate: Date = CAME,
): BookingAnswerColumns => ({ id, typeId, linkedUserId, linkedTransactionId: id - 1, balanceDate })

// Peter thanked Bibi: her RECEIVE row, on her list.
const THANKS = booking(501, TransactionTypeId.RECEIVE, PETER)

const answers = (
  lastOwnMessageAt: Array<[number, Date]> = [],
  lastSentAt: Array<[number, Date]> = [],
): ThanksAnswers => ({
  lastOwnMessageAt: new Map(lastOwnMessageAt),
  lastSentAt: new Map(lastSentAt),
})

describe('answeredOfBooking', () => {
  it('takes a message to the giver after the thank-you came as an answer', () => {
    expect(answeredOfBooking(THANKS, MEMBERS_HERE, answers([[PETER, later(1)]]))).toBe(true)
  })

  it('takes Gradido sent back to the giver after it came as an answer', () => {
    expect(answeredOfBooking(THANKS, MEMBERS_HERE, answers([], [[PETER, later(60_000)]]))).toBe(
      true,
    )
  })

  it('takes either one, and both', () => {
    expect(
      answeredOfBooking(THANKS, MEMBERS_HERE, answers([[PETER, later(5)]], [[PETER, later(9)]])),
    ).toBe(true)
    // An old message does not hide a later sending, nor an old sending a later message.
    expect(
      answeredOfBooking(THANKS, MEMBERS_HERE, answers([[PETER, later(-5)]], [[PETER, later(9)]])),
    ).toBe(true)
    expect(
      answeredOfBooking(THANKS, MEMBERS_HERE, answers([[PETER, later(9)]], [[PETER, later(-5)]])),
    ).toBe(true)
  })

  // Strictly after: what came at the very same moment is no answer to it.
  it('takes nothing of the very moment the thank-you came', () => {
    expect(answeredOfBooking(THANKS, MEMBERS_HERE, answers([[PETER, later(0)]]))).toBe(false)
    expect(answeredOfBooking(THANKS, MEMBERS_HERE, answers([], [[PETER, later(0)]]))).toBe(false)
  })

  it('takes nothing from before the thank-you came', () => {
    expect(
      answeredOfBooking(THANKS, MEMBERS_HERE, answers([[PETER, later(-1)]], [[PETER, later(-1)]])),
    ).toBe(false)
  })

  it('takes no answer to somebody else, and nothing where there is none', () => {
    expect(
      answeredOfBooking(THANKS, MEMBERS_HERE, answers([[BOB, later(1)]], [[BOB, later(1)]])),
    ).toBe(false)
    expect(answeredOfBooking(THANKS, MEMBERS_HERE, answers())).toBe(false)
  })

  // Only the recipient answers a thank-you: on the giver's SEND row there is nothing to answer,
  // whatever the maps say about the member whose list it is.
  it('answers false on a SEND row, whatever the times', () => {
    const sent = booking(500, TransactionTypeId.SEND, PETER)
    expect(
      answeredOfBooking(sent, MEMBERS_HERE, answers([[PETER, later(1)]], [[PETER, later(1)]])),
    ).toBe(false)
  })

  // ⛔ By this server's own rows (membersHere), not by an id alone: `users` holds rows for members
  // of other communities as well.
  it('answers false on a transfer from another community, a creation and a row without a giver', () => {
    const all = answers(
      [
        [LOTTE, later(1)],
        [PETER, later(1)],
      ],
      [[LOTTE, later(1)]],
    )
    expect(
      answeredOfBooking(booking(502, TransactionTypeId.RECEIVE, LOTTE), MEMBERS_HERE, all),
    ).toBe(false)
    expect(
      answeredOfBooking(booking(503, TransactionTypeId.RECEIVE, null), MEMBERS_HERE, all),
    ).toBe(false)
    expect(
      answeredOfBooking(booking(504, TransactionTypeId.CREATION, PETER), MEMBERS_HERE, all),
    ).toBe(false)
  })
})

describe('thanksPartnerIdsOf', () => {
  it('names the giver of each thank-you of a page once', () => {
    const page = [
      THANKS,
      booking(510, TransactionTypeId.RECEIVE, PETER, later(-10)),
      booking(511, TransactionTypeId.RECEIVE, BOB, later(-20)),
    ]
    expect(thanksPartnerIdsOf(page, MEMBERS_HERE)).toEqual([PETER, BOB])
  })

  it('leaves out SEND rows, transfers from another community and creations', () => {
    const page = [
      booking(520, TransactionTypeId.SEND, BOB),
      booking(521, TransactionTypeId.RECEIVE, LOTTE),
      booking(522, TransactionTypeId.RECEIVE, null),
      booking(523, TransactionTypeId.CREATION, PETER),
    ]
    expect(thanksPartnerIdsOf(page, MEMBERS_HERE)).toEqual([])
    expect(thanksPartnerIdsOf([], MEMBERS_HERE)).toEqual([])
  })
})
