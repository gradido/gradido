// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import { KEPT_PICTURES_MAX_PER_MEMBER as SERVER_MAX } from '../../../shared/src/const/frontendReadable'
import { KEPT_PICTURES_MAX_PER_MEMBER } from './useKeptPictures'

// How many people a member may keep a picture of exists twice: in the backend, which refuses a
// picture of one more, and here, where the wallet names the number to the member who reached it.
describe('the limit of kept pictures on both sides', () => {
  it('is the same number here and in the backend', () => {
    expect(KEPT_PICTURES_MAX_PER_MEMBER).toBe(SERVER_MAX)
  })
})
