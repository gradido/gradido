// AI-GENERATED — not an architecture reference
import { ChatMessagePage } from '@model/ChatMessagePage'

describe('ChatMessagePage', () => {
  it('carries whether the reader muted the conversation, as it is handed over', () => {
    expect(new ChatMessagePage([], false, true)).toEqual({
      messages: [],
      hasMore: false,
      mutedByMe: true,
    })
    expect(new ChatMessagePage([], true, false)).toEqual({
      messages: [],
      hasMore: true,
      mutedByMe: false,
    })
  })

  // E-024: the quiet is the one member's own. A page says nothing about the other's.
  it('has no field for whether the other member muted it', () => {
    expect(Object.keys(new ChatMessagePage([], false, false)).sort()).toEqual([
      'hasMore',
      'messages',
      'mutedByMe',
    ])
  })
})
