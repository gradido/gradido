// AI-GENERATED — not an architecture reference
import { describe, expect, it } from '@jest/globals'
import { TransactionTypeId } from 'database'
import {
  BookingLinkColumns,
  GreetingOfLink,
  greetingLinkIdOf,
  greetingLinkIdsOf,
  greetingOfBooking,
  senderIdOf,
} from './Transaction.logic'

// Bibi made link 7 and its greeting; Peter accepted it. Bob has nothing to do with either.
const BIBI = 11
const PETER = 22
const BOB = 33

/** Bibi's side of the booking: she sent. */
const sent = (overrides: Partial<BookingLinkColumns> = {}): BookingLinkColumns => ({
  typeId: TransactionTypeId.SEND,
  transactionLinkId: 7,
  userId: BIBI,
  linkedUserId: PETER,
  ...overrides,
})

/** Peter's side of it: he received, from Bibi. */
const received = (overrides: Partial<BookingLinkColumns> = {}): BookingLinkColumns => ({
  typeId: TransactionTypeId.RECEIVE,
  transactionLinkId: 7,
  userId: PETER,
  linkedUserId: BIBI,
  ...overrides,
})

/**
 * A booking received from another community, as federation writes it: no linked user, and the
 * number its row carries is the one the OTHER server gave its link.
 */
const fromAfar = (overrides: Partial<BookingLinkColumns> = {}): BookingLinkColumns =>
  received({ linkedUserId: null, ...overrides })

describe('senderIdOf', () => {
  it('is the owner of a booking sent', () => {
    expect(senderIdOf(sent())).toBe(BIBI)
    // Across the border the recipient is no member here; the sender still is.
    expect(senderIdOf(sent({ linkedUserId: null }))).toBe(BIBI)
  })

  it('is the linked member of a booking received within the community', () => {
    expect(senderIdOf(received())).toBe(BIBI)
  })

  it.each([[null], [undefined]])('is nobody for a booking received from afar (%s)', (linked) => {
    expect(senderIdOf(received({ linkedUserId: linked }))).toBeNull()
  })

  it('is nobody for a creation and for the virtual rows of the list', () => {
    for (const typeId of [
      TransactionTypeId.CREATION,
      TransactionTypeId.DECAY,
      TransactionTypeId.LINK_SUMMARY,
    ]) {
      expect(senderIdOf(sent({ typeId }))).toBeNull()
      expect(senderIdOf(received({ typeId }))).toBeNull()
    }
  })
})

describe('greetingLinkIdOf', () => {
  it('is the link of a booking received within the community', () => {
    expect(greetingLinkIdOf(received())).toBe(7)
  })

  it('is the link of a booking sent, within the community and across the border', () => {
    expect(greetingLinkIdOf(sent())).toBe(7)
    // The link is the sender's own, on this server, wherever it was redeemed.
    expect(greetingLinkIdOf(sent({ linkedUserId: null }))).toBe(7)
  })

  /**
   * ⛔ The row carries the id the SENDER's server gave its link. On this server the same
   * number is somebody else's link -- and its greeting somebody else's words.
   */
  it('is none for a booking received from another community, whatever number it carries', () => {
    expect(greetingLinkIdOf(fromAfar())).toBeNull()
    expect(greetingLinkIdOf(fromAfar({ linkedUserId: undefined }))).toBeNull()
  })

  /**
   * ⛔ A creation made from a contribution link has that link's id in the model's `linkId`.
   * It has no transaction link; even a row that carried the number would have none here.
   */
  it('is none for a creation, even where its row carries a number', () => {
    expect(greetingLinkIdOf(received({ typeId: TransactionTypeId.CREATION }))).toBeNull()
    expect(greetingLinkIdOf(sent({ typeId: TransactionTypeId.CREATION }))).toBeNull()
  })

  it('is none for the virtual rows of the list', () => {
    expect(greetingLinkIdOf(sent({ typeId: TransactionTypeId.DECAY }))).toBeNull()
    expect(greetingLinkIdOf(sent({ typeId: TransactionTypeId.LINK_SUMMARY }))).toBeNull()
  })

  it.each([[null], [undefined], [0]])('is none for a booking without a link (%s)', (id) => {
    expect(greetingLinkIdOf(received({ transactionLinkId: id }))).toBeNull()
    expect(greetingLinkIdOf(sent({ transactionLinkId: id }))).toBeNull()
  })
})

describe('greetingLinkIdsOf', () => {
  it('names every link of the page once, and only those a greeting can hang on', () => {
    expect(
      greetingLinkIdsOf([
        received({ transactionLinkId: 7 }),
        sent({ transactionLinkId: 9 }),
        // The same link twice on a page: one member, both rows.
        sent({ transactionLinkId: 7 }),
        received({ transactionLinkId: null }),
        received({ typeId: TransactionTypeId.CREATION, transactionLinkId: 11 }),
        fromAfar({ transactionLinkId: 13 }),
      ]),
    ).toEqual([7, 9])
  })

  it('is empty for a page without a booking made from a link', () => {
    expect(
      greetingLinkIdsOf([
        received({ transactionLinkId: null }),
        received({ typeId: TransactionTypeId.CREATION, transactionLinkId: null }),
        fromAfar({ transactionLinkId: 13 }),
      ]),
    ).toEqual([])
    expect(greetingLinkIdsOf([])).toEqual([])
  })
})

describe('greetingOfBooking', () => {
  const GREETING = { motif: 'morning-light', line: 'Einfach so — weil es Dich gibt.' }
  const OTHER = { motif: 'bouquet', line: null }
  // Link 7 is Bibi's, link 9 is Bob's.
  const greetings = new Map<number, GreetingOfLink<typeof GREETING | typeof OTHER>>([
    [7, { linkUserId: BIBI, greeting: GREETING }],
    [9, { linkUserId: BOB, greeting: OTHER }],
  ])

  it('is the greeting of the link on the sender’s side and on the recipient’s', () => {
    expect(greetingOfBooking(sent(), greetings)).toBe(GREETING)
    expect(greetingOfBooking(received(), greetings)).toBe(GREETING)
  })

  it('is the sender’s own greeting where the link was accepted in another community', () => {
    expect(greetingOfBooking(sent({ linkedUserId: null }), greetings)).toBe(GREETING)
  })

  it('is none where the link has no greeting, and none without a link', () => {
    expect(greetingOfBooking(sent({ transactionLinkId: 8 }), greetings)).toBeNull()
    expect(greetingOfBooking(received({ transactionLinkId: 8 }), greetings)).toBeNull()
    expect(greetingOfBooking(sent({ transactionLinkId: null }), greetings)).toBeNull()
    expect(greetingOfBooking(sent(), new Map())).toBeNull()
  })

  /**
   * ⛔ Across the border the sender and the link's code come from another server's request
   * (the disbursement of a link). The row is Bibi's, the link is Bob's: his greeting is not
   * hers to read.
   */
  it('is none on a booking sent with somebody else’s link', () => {
    expect(greetingOfBooking(sent({ transactionLinkId: 9 }), greetings)).toBeNull()
  })

  it('is none on a booking received from a member who did not make the link', () => {
    // Peter received from Bibi; the row carries the number of Bob's link.
    expect(greetingOfBooking(received({ transactionLinkId: 9 }), greetings)).toBeNull()
  })

  /**
   * ⛔ The number of a link of this server on a row from afar -- by chance, or because the
   * other server chose it -- gets nothing, even where the page holds that greeting for another
   * of its rows: whether a row gets a greeting is decided for the row.
   */
  it('is none on a booking received from another community, whatever the page holds', () => {
    expect(greetingOfBooking(fromAfar(), greetings)).toBeNull()
    expect(greetingOfBooking(fromAfar({ transactionLinkId: 9 }), greetings)).toBeNull()
  })

  it('is none on a creation and on the virtual rows, whatever their row carries', () => {
    for (const typeId of [
      TransactionTypeId.CREATION,
      TransactionTypeId.DECAY,
      TransactionTypeId.LINK_SUMMARY,
    ]) {
      expect(greetingOfBooking(sent({ typeId }), greetings)).toBeNull()
      expect(greetingOfBooking(received({ typeId }), greetings)).toBeNull()
    }
  })
})
