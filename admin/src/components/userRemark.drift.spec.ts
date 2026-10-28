// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import { USER_REMARK_MAX_CHARS as SERVER_MAX } from '../../../shared/src/const/frontendReadable'
import { USER_REMARK_MAX_CHARS } from './MemberRemark'

// The admin interface has no dependency on `shared`, so it keeps its own copy of the length the
// server takes for the moderation's remark on a member (setUserRemark). A longer field would let a
// moderator type words the server refuses; a shorter one would cut off a remark a colleague wrote.
describe('the length of the remark on a member', () => {
  it('is the length the server takes', () => {
    expect(USER_REMARK_MAX_CHARS).toBe(SERVER_MAX)
  })
})
