// AI-GENERATED — not an architecture reference
import { MEMBER_AVATARS_MAX_REFS as BACKEND_MAX } from '../../../backend/src/data/MemberAvatars.logic'
import { MEMBER_AVATARS_MAX_REFS } from './MemberAvatars.logic'

// How many members one picture question may name exists twice: in the backend, which caps
// what one wallet request may name, and here, where another community's question is
// answered. A community passes its wallets' lists on, so a lower number here refuses lists
// the backend let through -- whole, and without an error anybody sees. The federation
// module cannot import the backend, so the number is doubled and held together by this
// test, the way useMemberAvatars.drift.spec.js holds the wallet's copy.
//
// The backend file is imported directly. It is dependency-free by design.
describe('the picture-question cap on both sides of the border', () => {
  it('is the same number here and in the backend', () => {
    expect(MEMBER_AVATARS_MAX_REFS).toBe(BACKEND_MAX)
  })
})
