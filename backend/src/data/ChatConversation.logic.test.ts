// AI-GENERATED — not an architecture reference
import {
  CHAT_EDITS_CURSOR_PATTERN,
  CHAT_QUOTE_MAX_CHARS,
  chatEditsCursor,
  chatEditsPosition,
  chatQuoteExcerpt,
  isSameChatMember,
  nextChatEditsPosition,
  partnerReadUpTo,
} from './ChatConversation.logic'

const HOME = '11111111-1111-4111-8111-111111111111'
const OTHER = '22222222-2222-4222-8222-222222222222'
const ANNA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const BEN = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

describe('isSameChatMember', () => {
  it('knows a member by the whole pair', () => {
    expect(
      isSameChatMember(
        { communityUuid: HOME, gradidoId: ANNA },
        { communityUuid: HOME, gradidoId: ANNA },
      ),
    ).toBe(true)
    expect(
      isSameChatMember(
        { communityUuid: HOME, gradidoId: ANNA },
        { communityUuid: HOME, gradidoId: BEN },
      ),
    ).toBe(false)
    // The same gradido id in another community is another person.
    expect(
      isSameChatMember(
        { communityUuid: HOME, gradidoId: ANNA },
        { communityUuid: OTHER, gradidoId: ANNA },
      ),
    ).toBe(false)
  })

  it('reads a uuid in capitals as the same uuid, as the columns compare', () => {
    expect(
      isSameChatMember(
        { communityUuid: HOME, gradidoId: ANNA },
        { communityUuid: HOME.toUpperCase(), gradidoId: ANNA.toUpperCase() },
      ),
    ).toBe(true)
  })
})

/** How far the partner has read, as the two ticks show it (Chat E-093). */
describe('partnerReadUpTo', () => {
  // Letters in the uuid, not digits only: the capitals below have to change something.
  const HERE = 'cafecafe-cafe-4afe-8afe-cafecafecafe'
  const caller = { communityUuid: HERE, gradidoId: ANNA }
  const partnerHere = { communityUuid: HERE, gradidoId: BEN }
  const partnerElsewhere = { communityUuid: OTHER, gradidoId: BEN }

  it("gives a partner of this community's pointer, and 0 where they have read nothing", () => {
    expect(partnerReadUpTo(caller, partnerHere, 17)).toBe(17)
    expect(partnerReadUpTo(caller, partnerHere, null)).toBe(0)
    expect(partnerReadUpTo(caller, partnerHere, undefined)).toBe(0)
  })

  it('cannot know for a partner of another community, whatever their row says', () => {
    expect(partnerReadUpTo(caller, partnerElsewhere, 17)).toBeNull()
    expect(partnerReadUpTo(caller, partnerElsewhere, undefined)).toBeNull()
  })

  it('reads the community in capitals as the same community, as the columns compare', () => {
    const shouting = { communityUuid: HERE.toUpperCase(), gradidoId: BEN }
    expect(partnerReadUpTo(caller, shouting, 17)).toBe(17)
    expect(partnerReadUpTo({ ...caller, communityUuid: HERE.toUpperCase() }, partnerHere, 17)).toBe(
      17,
    )
  })
})

/**
 * The place a beat goes on from for changed messages (E-060), as it travels to the wallet and
 * back: the moment in milliseconds and the id within it.
 */
describe('the cursor of the changed messages', () => {
  const MOMENT = new Date('2026-10-01T09:00:20.123Z')

  it('writes a place as the moment in milliseconds and the id, and reads it back', () => {
    expect(chatEditsCursor({ editedAt: MOMENT, id: 0 })).toBe(`${MOMENT.getTime()}-0`)
    expect(chatEditsCursor({ editedAt: MOMENT, id: 4711 })).toBe(`${MOMENT.getTime()}-4711`)
    expect(chatEditsPosition(`${MOMENT.getTime()}-4711`)).toEqual({ editedAt: MOMENT, id: 4711 })
    expect(chatEditsPosition('0-0')).toEqual({ editedAt: new Date(0), id: 0 })
  })

  it('takes two numbers with a hyphen between them for a cursor, and nothing else', () => {
    for (const cursor of ['0-0', `${MOMENT.getTime()}-4711`, '999999999999999-4294967295']) {
      expect(CHAT_EDITS_CURSOR_PATTERN.test(cursor)).toBe(true)
      // Every cursor the pattern takes names a moment the database can be asked from.
      expect(Number.isNaN(chatEditsPosition(cursor).editedAt.getTime())).toBe(false)
    }
    for (const noCursor of [
      '',
      '1759309220123',
      '1759309220123-',
      '-5',
      '1759309220123-5-6',
      '1759309220123-5 or 1=1',
      ' 1759309220123-5',
      '1759309220123-5\n',
      '2026-10-01T09:00:20.123Z',
      '1.5-2',
      '1e9-2',
      '1234567890123456-1',
      '1-12345678901',
    ]) {
      expect(CHAT_EDITS_CURSOR_PATTERN.test(noCursor)).toBe(false)
      expect(() => chatEditsPosition(noCursor)).toThrow('not a cursor')
    }
  })
})

/**
 * Where the next beat goes on from for changed messages (E-060): the settled moment, or exactly
 * after the last message handed out where more were left -- and never past what is settled.
 */
describe('nextChatEditsPosition', () => {
  const SETTLED = new Date('2026-10-01T09:00:20.000Z')
  const at = (ms: number) => new Date(SETTLED.getTime() + ms)

  it('is the settled moment, before every message of it, where the answer held every change', () => {
    expect(nextChatEditsPosition(SETTLED, null)).toEqual({ editedAt: SETTLED, id: 0 })
  })

  it('is the last message handed out where more are left, to go on exactly after it', () => {
    const last = { editedAt: at(-60_000), id: 8 }
    expect(nextChatEditsPosition(SETTLED, last)).toEqual(last)
    // One millisecond before what is settled still lies before it.
    expect(nextChatEditsPosition(SETTLED, { editedAt: at(-1), id: 8 })).toEqual({
      editedAt: at(-1),
      id: 8,
    })
  })

  // ⛔ A change before the last one may still be on its way: the place never passes what is
  // settled. What was left over the cap lies after the last one, so it is not passed over.
  it('is the settled moment where the last one handed out lies at it or later', () => {
    expect(nextChatEditsPosition(SETTLED, { editedAt: at(4_000), id: 8 })).toEqual({
      editedAt: SETTLED,
      id: 0,
    })
    expect(nextChatEditsPosition(SETTLED, { editedAt: at(0), id: 8 })).toEqual({
      editedAt: SETTLED,
      id: 0,
    })
  })
})

/** How much of a quoted message goes with its answer: the beginning, a line's worth. */
describe('chatQuoteExcerpt', () => {
  it('hands a short text on whole, raw as it is', () => {
    expect(chatQuoteExcerpt('Shall we meet at **ten**?\nAt the market.')).toBe(
      'Shall we meet at **ten**?\nAt the market.',
    )
    expect(chatQuoteExcerpt('')).toBe('')
  })

  it('cuts a long text off after the characters a quotation carries, and not one earlier', () => {
    expect(CHAT_QUOTE_MAX_CHARS).toBe(200)
    const atTheLimit = 'a'.repeat(CHAT_QUOTE_MAX_CHARS)
    expect(chatQuoteExcerpt(atTheLimit)).toBe(atTheLimit)
    expect(chatQuoteExcerpt(`${atTheLimit}b`)).toBe(atTheLimit)
    expect(chatQuoteExcerpt('x'.repeat(2000))).toHaveLength(CHAT_QUOTE_MAX_CHARS)
  })

  // A sign of two code units is one character: taken whole, or not at all.
  it('counts as the text is read, and never cuts a sign in two', () => {
    const excerpt = chatQuoteExcerpt('🌻'.repeat(CHAT_QUOTE_MAX_CHARS + 5))
    expect([...excerpt]).toHaveLength(CHAT_QUOTE_MAX_CHARS)
    expect(excerpt).toBe('🌻'.repeat(CHAT_QUOTE_MAX_CHARS))
    // With the cut falling into the middle of one, counted by code units.
    const mixed = `${'a'.repeat(CHAT_QUOTE_MAX_CHARS - 1)}🌻🌻`
    expect(chatQuoteExcerpt(mixed)).toBe(`${'a'.repeat(CHAT_QUOTE_MAX_CHARS - 1)}🌻`)
  })
})
