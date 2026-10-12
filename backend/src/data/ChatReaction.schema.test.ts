// AI-GENERATED — not an architecture reference
import { CHAT_REACTION_EMOJI_ROWS } from 'shared'
import * as v from 'valibot'
import { chatReactionEmojiSchema } from './ChatReaction.schema'

const THUMB = '👍'
const SEEDLING = '🌱'
const HEART = '❤️'
const taken = (emoji: unknown): boolean => v.safeParse(chatReactionEmojiSchema, emoji).success

describe('chatReactionEmojiSchema', () => {
  it('takes each of the forty-eight of the list, and they are forty-eight different ones', () => {
    const all = CHAT_REACTION_EMOJI_ROWS.flat()
    expect(all).toHaveLength(48)
    expect(new Set(all).size).toBe(48)
    expect(all.filter((emoji) => !taken(emoji))).toEqual([])
  })

  // ⛔ Compared whole: the heart of the list carries its selector, and the bare one is not it.
  it('takes a sign of two code points only with its selector', () => {
    expect([...HEART]).toHaveLength(2)
    expect(taken(HEART)).toBe(true)
    expect(taken('❤')).toBe(false)
  })

  it.each([
    ['an emoji that is not in the list', '🦄'],
    ['two of the list', `${THUMB}${SEEDLING}`],
    ['one of the list with a skin tone', '👍🏽'],
    ['one of the list with a space', `${THUMB} `],
    ['a word', 'ja'],
    ['nothing', ''],
    ['what is no string', 7],
    ['a list with one of them', [THUMB]],
  ])('takes no %s', (_name, emoji) => {
    expect(taken(emoji)).toBe(false)
  })

  // A message ends up in the error log: it says what is wrong, and nothing of what was sent.
  it('quotes nothing of what was sent in its message', () => {
    const refused = v.safeParse(chatReactionEmojiSchema, 'Hofflohmarkt am Sonntag')
    expect(refused.success).toBe(false)
    const messages = (refused.issues ?? []).map((issue) => issue.message)
    expect(messages).toEqual(['Chat reaction: not one of the emoji'])
  })
})
