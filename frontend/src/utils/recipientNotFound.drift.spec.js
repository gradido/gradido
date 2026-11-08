// AI-GENERATED — not an architecture reference
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  RECIPIENT_NOT_FOUND as SERVER_RECIPIENT_NOT_FOUND,
  USER_NOT_FOUND as SERVER_USER_NOT_FOUND,
} from '../../../shared/src/const/frontendReadable'
import { RECIPIENT_NOT_FOUND, USER_NOT_FOUND } from './recipientNotFound'

// The wallet recognises "nobody has that account" by the backend's words and keeps its own copy of
// them: it has no dependency on `shared`. The file in `shared` is imported directly; it is
// dependency-free by design (see the note at its top).
describe('the words the wallet knows are the ones the backend says', () => {
  it('for `user`', () => {
    expect(USER_NOT_FOUND).toBe(SERVER_USER_NOT_FOUND)
  })

  it('for a send, to this community or another one', () => {
    expect(RECIPIENT_NOT_FOUND).toBe(SERVER_RECIPIENT_NOT_FOUND)
  })
})
