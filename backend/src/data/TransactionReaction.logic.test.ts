// AI-GENERATED — not an architecture reference
import { TransactionReactionOfBooking, TransactionTypeId } from 'database'
import {
  BookingReactionColumns,
  canReactToBooking,
  isTransferAmongMembersHere,
  reactionKeyOf,
  reactionKeysOf,
  reactionOfBooking,
} from './TransactionReaction.logic'

const BIBI = 11
const PETER = 12
// A member of another community the federation stored a `users` row for: an id, and no member here.
const LOTTE = 77
const MEMBERS_HERE: ReadonlySet<number> = new Set([BIBI, PETER])

const booking = (
  id: number,
  typeId: TransactionTypeId,
  linkedUserId: number | null,
  linkedTransactionId: number | null,
): BookingReactionColumns => ({ id, typeId, linkedUserId, linkedTransactionId })

// Peter sent to Bibi: his SEND row 500, her RECEIVE row 501.
const SENT = booking(500, TransactionTypeId.SEND, BIBI, 501)
const RECEIVED = booking(501, TransactionTypeId.RECEIVE, PETER, 500)
const reactions = (...rows: TransactionReactionOfBooking[]) =>
  new Map(rows.map((row) => [row.transactionId, row] as const))
const HEART = '❤️'

describe('isTransferAmongMembersHere', () => {
  it('takes both rows of a transfer between two members of this server', () => {
    expect(isTransferAmongMembersHere(SENT, MEMBERS_HERE)).toBe(true)
    expect(isTransferAmongMembersHere(RECEIVED, MEMBERS_HERE)).toBe(true)
  })

  // ⛔ An id is no proof: the federation stores a row for a member of another community, and
  // their bookings carry it.
  it('takes no booking with a member the federation stored a row for', () => {
    expect(
      isTransferAmongMembersHere(booking(1, TransactionTypeId.RECEIVE, LOTTE, 9), MEMBERS_HERE),
    ).toBe(false)
    expect(
      isTransferAmongMembersHere(booking(2, TransactionTypeId.SEND, LOTTE, 9), MEMBERS_HERE),
    ).toBe(false)
  })

  it('takes no booking that names its counterparty by the pair alone', () => {
    expect(
      isTransferAmongMembersHere(booking(1, TransactionTypeId.RECEIVE, null, 9), MEMBERS_HERE),
    ).toBe(false)
  })

  // A creation carries the confirming moderator's id in the column, and is booked with nobody.
  it('takes no creation, whoever confirmed it, and none of the virtual rows', () => {
    expect(
      isTransferAmongMembersHere(booking(1, TransactionTypeId.CREATION, PETER, null), MEMBERS_HERE),
    ).toBe(false)
    expect(
      isTransferAmongMembersHere(booking(-1, TransactionTypeId.DECAY, PETER, null), MEMBERS_HERE),
    ).toBe(false)
    expect(
      isTransferAmongMembersHere(
        booking(-2, TransactionTypeId.LINK_SUMMARY, PETER, null),
        MEMBERS_HERE,
      ),
    ).toBe(false)
  })
})

describe('reactionKeyOf and reactionKeysOf', () => {
  it("asks with the recipient's own row for a RECEIVE, with the row it names for a SEND", () => {
    expect(reactionKeyOf(RECEIVED, MEMBERS_HERE)).toBe(501)
    expect(reactionKeyOf(SENT, MEMBERS_HERE)).toBe(501)
  })

  // ⛔ A booking with another community has no second row here, whatever number it carries.
  it('asks nothing for a transfer with another community, whatever number it carries', () => {
    expect(reactionKeyOf(booking(600, TransactionTypeId.SEND, LOTTE, 501), MEMBERS_HERE)).toBeNull()
    expect(reactionKeyOf(booking(601, TransactionTypeId.SEND, null, 501), MEMBERS_HERE)).toBeNull()
    expect(
      reactionKeyOf(booking(602, TransactionTypeId.RECEIVE, LOTTE, 500), MEMBERS_HERE),
    ).toBeNull()
  })

  it('asks nothing for a SEND row that names no other row, and for a creation', () => {
    expect(reactionKeyOf(booking(700, TransactionTypeId.SEND, BIBI, null), MEMBERS_HERE)).toBeNull()
    expect(
      reactionKeyOf(booking(701, TransactionTypeId.CREATION, PETER, 501), MEMBERS_HERE),
    ).toBeNull()
  })

  it('names each booking of a page once, and none for a page without such a transfer', () => {
    const page = [
      RECEIVED,
      SENT,
      booking(510, TransactionTypeId.RECEIVE, PETER, 509),
      booking(700, TransactionTypeId.CREATION, PETER, null),
      booking(600, TransactionTypeId.SEND, LOTTE, 501),
    ]

    expect(reactionKeysOf(page, MEMBERS_HERE)).toEqual([501, 510])
    expect(
      reactionKeysOf([booking(700, TransactionTypeId.CREATION, PETER, null)], MEMBERS_HERE),
    ).toEqual([])
    expect(reactionKeysOf([], MEMBERS_HERE)).toEqual([])
  })
})

describe('reactionOfBooking', () => {
  const filed = reactions({ transactionId: 501, emoji: HEART, linkedTransactionId: 500 })

  it('shows the reaction on both rows of the transfer', () => {
    expect(reactionOfBooking(RECEIVED, MEMBERS_HERE, filed)).toBe(HEART)
    expect(reactionOfBooking(SENT, MEMBERS_HERE, filed)).toBe(HEART)
  })

  it('shows none where nobody reacted', () => {
    expect(reactionOfBooking(RECEIVED, MEMBERS_HERE, reactions())).toBeNull()
    expect(reactionOfBooking(SENT, MEMBERS_HERE, reactions())).toBeNull()
  })

  // ⛔ The two rows of a transfer name EACH OTHER. A SEND row that names a RECEIVE row which
  // names another row back is not that transfer's other half.
  it('shows a sender no reaction of a booking that does not name their own row back', () => {
    const stranger = booking(900, TransactionTypeId.SEND, BIBI, 501)

    expect(reactionOfBooking(stranger, MEMBERS_HERE, filed)).toBeNull()
    expect(
      reactionOfBooking(
        SENT,
        MEMBERS_HERE,
        reactions({ transactionId: 501, emoji: HEART, linkedTransactionId: null }),
      ),
    ).toBeNull()
  })

  // ⛔ A booking with another community may carry any number: that it is the id of a booking
  // here with a reaction, which even names this row back, shows nothing.
  it('shows no reaction on a transfer with another community, whatever the numbers say', () => {
    const toLotte = booking(500, TransactionTypeId.SEND, LOTTE, 501)
    const fromLotte = booking(501, TransactionTypeId.RECEIVE, LOTTE, 500)

    expect(reactionOfBooking(toLotte, MEMBERS_HERE, filed)).toBeNull()
    expect(reactionOfBooking(fromLotte, MEMBERS_HERE, filed)).toBeNull()
    expect(
      reactionOfBooking(booking(500, TransactionTypeId.SEND, null, 501), MEMBERS_HERE, filed),
    ).toBeNull()
  })

  it('shows none on a creation that carries the id of a booking with a reaction', () => {
    expect(
      reactionOfBooking(booking(501, TransactionTypeId.CREATION, PETER, 500), MEMBERS_HERE, filed),
    ).toBeNull()
  })
})

describe('canReactToBooking', () => {
  // Only the recipient reacts (Bernd, 11.10.2026).
  it('lets the member react to their own RECEIVE row of a transfer from a member here, and to no SEND row', () => {
    expect(canReactToBooking(RECEIVED, MEMBERS_HERE)).toBe(true)
    expect(canReactToBooking(SENT, MEMBERS_HERE)).toBe(false)
  })

  it('lets nobody react to a transfer from another community, a creation or a virtual row', () => {
    expect(canReactToBooking(booking(1, TransactionTypeId.RECEIVE, LOTTE, 9), MEMBERS_HERE)).toBe(
      false,
    )
    expect(canReactToBooking(booking(2, TransactionTypeId.RECEIVE, null, 9), MEMBERS_HERE)).toBe(
      false,
    )
    expect(
      canReactToBooking(booking(3, TransactionTypeId.CREATION, PETER, null), MEMBERS_HERE),
    ).toBe(false)
    expect(canReactToBooking(booking(-1, TransactionTypeId.DECAY, null, null), MEMBERS_HERE)).toBe(
      false,
    )
  })
})
