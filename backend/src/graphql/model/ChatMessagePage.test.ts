// AI-GENERATED — not an architecture reference
import { ChatMessagePage } from '@model/ChatMessagePage'

describe('ChatMessagePage', () => {
  it('carries whether the reader muted the conversation, as it is handed over', () => {
    expect(new ChatMessagePage([], false, true)).toEqual({
      messages: [],
      hasMore: false,
      mutedByMe: true,
      partnerReadUpTo: null,
    })
    expect(new ChatMessagePage([], true, false)).toEqual({
      messages: [],
      hasMore: true,
      mutedByMe: false,
      partnerReadUpTo: null,
    })
  })

  // Chat E-093: how far the other member has read, where it is handed over -- a group's page
  // hands over none.
  it('carries how far the other member has read, null where none is handed over', () => {
    expect(new ChatMessagePage([], false, false, 17).partnerReadUpTo).toBe(17)
    expect(new ChatMessagePage([], false, false, 0).partnerReadUpTo).toBe(0)
    expect(new ChatMessagePage([], false, false).partnerReadUpTo).toBeNull()
  })

  // E-024: the quiet is the one member's own. A page says nothing about the other's.
  it('has no field for whether the other member muted it', () => {
    expect(Object.keys(new ChatMessagePage([], false, false)).sort()).toEqual([
      'hasMore',
      'messages',
      'mutedByMe',
      'partnerReadUpTo',
    ])
  })
})
