// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gql, InMemoryCache } from '@apollo/client/core'
import { APOLLO_TYPE_POLICIES } from './apolloCachePolicies'

/**
 * The reactions to a chat message in a REAL cache (11.10.2026): a newer list takes the place of
 * the older one, and the cache does not warn about it. In the built wallet it did, in the
 * console, each time a member took a reaction back.
 */
describe('the cache and the reactions to a message', () => {
  const fragment = gql`
    fragment reactionsOfMessage on ChatMessage {
      id
      reactions {
        emoji
        count
        mine
      }
    }
  `
  const reaction = (emoji, count = 1, mine = false) => ({
    __typename: 'ChatMessageReaction',
    emoji,
    count,
    mine,
  })
  const write = (cache, reactions) =>
    cache.writeFragment({
      id: 'ChatMessage:7',
      fragment,
      data: { __typename: 'ChatMessage', id: 7, reactions },
    })
  const read = (cache) =>
    cache.readFragment({ id: 'ChatMessage:7', fragment }).reactions.map((r) => r.emoji)

  let warn
  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    warn.mockRestore()
  })

  it('replaces the list by the newer one, shorter or longer, and says nothing', () => {
    const cache = new InMemoryCache({ typePolicies: APOLLO_TYPE_POLICIES })
    write(cache, [reaction('👍', 2, true), reaction('❤️')])
    expect(read(cache)).toEqual(['👍', '❤️'])

    write(cache, [reaction('❤️')])
    expect(read(cache)).toEqual(['❤️'])

    write(cache, [])
    expect(read(cache)).toEqual([])

    write(cache, [reaction('🌱', 1, true)])
    expect(read(cache)).toEqual(['🌱'])
    expect(warn).not.toHaveBeenCalled()
  })

  // The control: this is what the rule is for. Without it the list is replaced just the same --
  // and the cache warns once it got shorter. (Should Apollo stop warning, this test says so, and
  // the rule can go.)
  it('would warn without the rule, as soon as a reaction is taken back', () => {
    const cache = new InMemoryCache()
    write(cache, [reaction('👍', 2, true), reaction('❤️')])
    write(cache, [reaction('❤️')])

    expect(read(cache)).toEqual(['❤️'])
    expect(warn).toHaveBeenCalled()
  })
})
