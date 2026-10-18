// AI-GENERATED — not an architecture reference
import * as v from 'valibot'
import { schema } from './schema'

const firstIssue = (input: Record<string, string>) => {
  const result = v.safeParse(schema, input)
  return result.success ? undefined : result.issues[0]
}

describe('EMAIL_CODE_REQUEST_TIME', () => {
  it('may be 0 in development and test', () => {
    expect(firstIssue({ NODE_ENV: 'development', EMAIL_CODE_REQUEST_TIME: '0' })).toBeUndefined()
    expect(firstIssue({ NODE_ENV: 'test', EMAIL_CODE_REQUEST_TIME: '0' })).toBeUndefined()
  })

  it('must be at least 1 in production', () => {
    const issue = firstIssue({ NODE_ENV: 'production', EMAIL_CODE_REQUEST_TIME: '0' })
    expect(issue?.path?.map((item) => item.key)).toEqual(['EMAIL_CODE_REQUEST_TIME'])
    expect(firstIssue({ NODE_ENV: 'production', EMAIL_CODE_REQUEST_TIME: '1' })).toBeUndefined()
  })

  it('is never negative', () => {
    expect(firstIssue({ NODE_ENV: 'development', EMAIL_CODE_REQUEST_TIME: '-1' })).toBeDefined()
  })
})
