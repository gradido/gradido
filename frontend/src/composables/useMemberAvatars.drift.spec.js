// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import { MEMBER_AVATARS_MAX_REFS as SERVER_MAX } from '../../../backend/src/data/MemberAvatars.logic'
import { MEMBER_AVATARS_MAX_REFS } from './useMemberAvatars'

// How many members one picture request may name exists twice: in the backend, which
// refuses an oversized request before a row is read, and here, because the wallet has to
// cut its list into requests the server will accept and has no dependency on the backend.
//
// What drift costs is not a slower page but a blank one: a request over the cap is refused
// WHOLE, and the wallet swallows a refused request to fall back to initials. Lower the
// server's number without lowering this one and every chunk is refused -- no faces at all,
// no error anywhere, for everybody.
//
// The backend file is imported directly. It is dependency-free by design, and vitest
// transforms TypeScript on its own, the same way avatarColorIndex.drift.spec.js does.

describe('the picture-request cap on both sides', () => {
  it('is the same number here and in the backend', () => {
    expect(MEMBER_AVATARS_MAX_REFS).toBe(SERVER_MAX)
  })
})
