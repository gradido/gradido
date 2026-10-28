// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import { USER_REMARK_MAX_CHARS as SERVER_MAX } from '../../../shared/src/const/frontendReadable'
import { USER_REMARK_MAX_CHARS } from './MemberRemark'

// The admin interface has no dependency on `shared`, so it keeps its own copy of the length the
// server takes for the moderation's remark on a member (setUserRemark). A larger number here would
// let a moderator type words the server refuses. (The two count differently -- the field in UTF-16
// code units, the server an emoji as one character --, which leaves the field the stricter.)
describe('the length of the remark on a member', () => {
  it('is the length the server takes', () => {
    expect(USER_REMARK_MAX_CHARS).toBe(SERVER_MAX)
  })
})
