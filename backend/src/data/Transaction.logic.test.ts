// AI-GENERATED — not an architecture reference
import { describe, expect, it } from '@jest/globals'
import { TransactionTypeId } from 'database'
import { BookingLinkColumns, greetingLinkIdOf, greetingLinkIdsOf } from './Transaction.logic'

// Uuids with letters in both cases would be two communities to `===`; these are written as
// the server writes them, in lower case.
const HOME = 'a1b2c3d4-0000-4000-8000-0000000000aa'
const ELSEWHERE = 'f9e8d7c6-0000-4000-8000-0000000000bb'

const booking = (overrides: Partial<BookingLinkColumns> = {}): BookingLinkColumns => ({
  typeId: TransactionTypeId.RECEIVE,
  transactionLinkId: 7,
  userCommunityUuid: HOME,
  linkedUserCommunityUuid: HOME,
  ...overrides,
})

describe('greetingLinkIdOf', () => {
  it('is the link of a booking received within the community', () => {
    expect(greetingLinkIdOf(booking())).toBe(7)
  })

  it('is the link of a booking sent, within the community and across the border', () => {
    expect(greetingLinkIdOf(booking({ typeId: TransactionTypeId.SEND }))).toBe(7)
    // The link is the sender's own, on this server, wherever it was redeemed.
    expect(
      greetingLinkIdOf(
        booking({ typeId: TransactionTypeId.SEND, linkedUserCommunityUuid: ELSEWHERE }),
      ),
    ).toBe(7)
  })

  /**
   * ⛔ The row carries the id the SENDER's server gave its link. On this server the same
   * number is somebody else's link -- and its greeting somebody else's words.
   */
  it('is none for a booking received from another community, whatever number it carries', () => {
    expect(greetingLinkIdOf(booking({ linkedUserCommunityUuid: ELSEWHERE }))).toBeNull()
  })

  it.each([
    [null, HOME],
    [HOME, null],
    [null, null],
    [undefined, undefined],
    ['', ''],
  ])('is none for a booking received where a community is not named (%s, %s)', (own, theirs) => {
    expect(
      greetingLinkIdOf(booking({ userCommunityUuid: own, linkedUserCommunityUuid: theirs })),
    ).toBeNull()
  })

  /**
   * ⛔ A creation made from a contribution link has that link's id in the model's `linkId`.
   * It has no transaction link; even a row that carried the number would have none here.
   */
  it('is none for a creation, even where its row carries a number', () => {
    expect(greetingLinkIdOf(booking({ typeId: TransactionTypeId.CREATION }))).toBeNull()
  })

  it('is none for the virtual rows of the list', () => {
    expect(greetingLinkIdOf(booking({ typeId: TransactionTypeId.DECAY }))).toBeNull()
    expect(greetingLinkIdOf(booking({ typeId: TransactionTypeId.LINK_SUMMARY }))).toBeNull()
  })

  it.each([[null], [undefined], [0]])('is none for a booking without a link (%s)', (id) => {
    expect(greetingLinkIdOf(booking({ transactionLinkId: id }))).toBeNull()
    expect(
      greetingLinkIdOf(booking({ typeId: TransactionTypeId.SEND, transactionLinkId: id })),
    ).toBeNull()
  })
})

describe('greetingLinkIdsOf', () => {
  it('names every link of the page once, and only those a greeting can hang on', () => {
    expect(
      greetingLinkIdsOf([
        booking({ transactionLinkId: 7 }),
        booking({ typeId: TransactionTypeId.SEND, transactionLinkId: 9 }),
        // The same link twice on a page: one member, both rows.
        booking({ typeId: TransactionTypeId.SEND, transactionLinkId: 7 }),
        booking({ transactionLinkId: null }),
        booking({ typeId: TransactionTypeId.CREATION, transactionLinkId: 11 }),
        booking({ transactionLinkId: 13, linkedUserCommunityUuid: ELSEWHERE }),
      ]),
    ).toEqual([7, 9])
  })

  it('is empty for a page without a booking made from a link', () => {
    expect(
      greetingLinkIdsOf([
        booking({ transactionLinkId: null }),
        booking({ typeId: TransactionTypeId.CREATION, transactionLinkId: null }),
      ]),
    ).toEqual([])
    expect(greetingLinkIdsOf([])).toEqual([])
  })
})
