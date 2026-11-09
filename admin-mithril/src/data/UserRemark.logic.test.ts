// AI-GENERATED — not an architecture reference
import { expect, it } from 'bun:test'
import { USER_REMARK_MAX_CHARS as SERVER_MAX } from '../../../shared/src/const/frontendReadable'
import { asKept, USER_REMARK_MAX_CHARS } from './UserRemark.logic'

it('lets through no more of a remark than the server takes', () => {
  expect(USER_REMARK_MAX_CHARS).toBe(SERVER_MAX)
})

it('keeps words as they are, and whitespace alone as no remark', () => {
  expect(asKept(' a\n')).toBe(' a\n')
  expect(asKept(' \n ')).toBe('')
})
