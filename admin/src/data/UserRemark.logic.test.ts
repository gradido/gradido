// AI-GENERATED — not an architecture reference
import { expect, it } from 'bun:test'
import { asKept } from './UserRemark.logic'

it('keeps words as they are, and whitespace alone as no remark', () => {
  expect(asKept(' a\n')).toBe(' a\n')
  expect(asKept(' \n ')).toBe('')
})
