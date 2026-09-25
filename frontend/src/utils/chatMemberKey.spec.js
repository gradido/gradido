// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { chatMemberKey } from './chatMemberKey'

describe('chatMemberKey', () => {
  // The server compares the pair without regard to case (P2a).
  it('writes the pair in lower case', () => {
    expect(chatMemberKey({ communityUuid: 'HOME-Uuid', gradidoID: 'Carla-ID' })).toBe(
      'home-uuid/carla-id',
    )
  })

  // ⛔ LOG-036: a member off a booking row names no community, the lookup brings it -- the same
  // person both times, and so the same key.
  it('writes a missing community as the own one, so null and the own uuid are one person', () => {
    const own = 'HOME-UUID'
    expect(chatMemberKey({ communityUuid: null, gradidoID: 'carla-id' }, own)).toBe(
      chatMemberKey({ communityUuid: 'home-uuid', gradidoID: 'carla-id' }, own),
    )
    expect(chatMemberKey({ gradidoID: 'carla-id' }, own)).toBe('home-uuid/carla-id')
  })

  // The same id in another community is another person.
  it('keeps another community apart', () => {
    expect(chatMemberKey({ communityUuid: 'provence-uuid', gradidoID: 'carla-id' }, 'home')).toBe(
      'provence-uuid/carla-id',
    )
  })

  it('writes an unknown own community empty, as before', () => {
    expect(chatMemberKey({ communityUuid: null, gradidoID: 'carla-id' })).toBe('/carla-id')
    expect(chatMemberKey(null)).toBe('/')
  })
})
