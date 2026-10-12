// AI-GENERATED — not an architecture reference
import { ChatMessageReactionSelect } from 'database'
import { chatReactionCounts } from './ChatReaction.logic'

const HOME = '1a1a1a1a-1111-4111-8111-11111111aaaa'
const LENA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const MAX = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const NORA = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const THUMB = '👍'
const SEEDLING = '🌱'
const HEART = '❤️'

const reaction = (
  id: number,
  gradidoId: string,
  emoji: string,
  communityUuid = HOME,
): ChatMessageReactionSelect => ({
  id,
  messageId: 5,
  communityUuid,
  gradidoId,
  emoji,
  createdAt: new Date('2026-10-11T06:00:00.000Z'),
})

const lena = { communityUuid: HOME, gradidoId: LENA }

describe('chatReactionCounts', () => {
  it('answers none for a message nobody reacted to', () => {
    expect(chatReactionCounts([], lena)).toEqual([])
  })

  it('counts each emoji once, in the order it came up first, and says whether the reader reacted with it', () => {
    const rows = [
      reaction(1, MAX, THUMB),
      reaction(2, LENA, HEART),
      reaction(3, NORA, THUMB),
      reaction(4, 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', SEEDLING),
    ]

    expect(chatReactionCounts(rows, lena)).toEqual([
      { emoji: THUMB, count: 2, mine: false },
      { emoji: HEART, count: 1, mine: true },
      { emoji: SEEDLING, count: 1, mine: false },
    ])
    // The same rows read by Max: the counts are the same, the own one is another.
    expect(chatReactionCounts(rows, { communityUuid: HOME, gradidoId: MAX })).toEqual([
      { emoji: THUMB, count: 2, mine: true },
      { emoji: HEART, count: 1, mine: false },
      { emoji: SEEDLING, count: 1, mine: false },
    ])
  })

  it('takes the reader for the one who reacted whatever the case of the pair, and not in another community', () => {
    expect(
      chatReactionCounts([reaction(1, LENA.toUpperCase(), THUMB, HOME.toUpperCase())], lena),
    ).toEqual([{ emoji: THUMB, count: 1, mine: true }])
    expect(
      chatReactionCounts([reaction(1, LENA, THUMB, '22222222-2222-4222-8222-222222222222')], lena),
    ).toEqual([{ emoji: THUMB, count: 1, mine: false }])
  })

  // ⛔ An emoji is told from another by what it is, not by how a database would collate it.
  it('keeps a thumb and a seedling apart', () => {
    expect(
      chatReactionCounts([reaction(1, MAX, THUMB), reaction(2, NORA, SEEDLING)], lena).map(
        (entry) => entry.emoji,
      ),
    ).toEqual([THUMB, SEEDLING])
  })

  it('hands back counts of its own every time', () => {
    const rows = [reaction(1, MAX, THUMB)]
    const first = chatReactionCounts(rows, lena)
    first[0].count = 99
    expect(chatReactionCounts(rows, lena)).toEqual([{ emoji: THUMB, count: 1, mine: false }])
  })
})
