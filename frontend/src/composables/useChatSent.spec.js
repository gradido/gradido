// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import { noteChatMessageSent, onChatMessageSent } from './useChatSent'

/**
 * The event a message to one person makes (W3b, F E-046): heard by whoever listens, and by
 * nobody once they stopped.
 */
describe('useChatSent', () => {
  it('says the person written to, by the pair, to everybody who listens', () => {
    const one = []
    const other = []
    const stopOne = onChatMessageSent((person) => one.push(person))
    const stopOther = onChatMessageSent((person) => other.push(person))

    noteChatMessageSent({ gradidoID: 'lena-id', communityUuid: 'home-uuid' })

    expect(one).toEqual([{ gradidoID: 'lena-id', communityUuid: 'home-uuid' }])
    expect(other).toEqual(one)
    stopOne()
    stopOther()
  })

  // The thread names a person without a community so: a missing community is this one.
  it('names a missing community as none', () => {
    const heard = []
    const stop = onChatMessageSent((person) => heard.push(person))

    noteChatMessageSent({ gradidoID: 'lena-id' })

    expect(heard).toEqual([{ gradidoID: 'lena-id', communityUuid: null }])
    stop()
  })

  it('says nothing to whoever stopped listening', () => {
    const heard = []
    const stop = onChatMessageSent((person) => heard.push(person))
    stop()

    noteChatMessageSent({ gradidoID: 'lena-id', communityUuid: 'home-uuid' })

    expect(heard).toEqual([])
  })
})
