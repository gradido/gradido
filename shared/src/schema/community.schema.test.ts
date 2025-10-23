import { v4 as uuidv4 } from 'uuid'
import { communityAuthenticatedSchema } from './community.schema'
import { describe, it, expect } from 'bun:test'


describe('communityAuthenticatedSchema', () => {
  it('should return an error if communityUuid is not a uuidv4', () => {
    const data = communityAuthenticatedSchema.safeParse({
      communityUuid: '1234567890',
      authenticatedAt: new Date(),
    })

    expect(data.success).toBe(false)
    expect(data.error?.issues[0].path).toEqual(['communityUuid'])
  })

  it('should return an error if authenticatedAt is not a date', () => {
    const data = communityAuthenticatedSchema.safeParse({
      communityUuid: uuidv4(),
      authenticatedAt: '2022-01-01',
    })

    expect(data.success).toBe(false)
    expect(data.error?.issues[0].path).toEqual(['authenticatedAt'])
  })

  it('should return no error for valid data and valid uuid4', () => {
    const data = communityAuthenticatedSchema.safeParse({
      communityUuid: uuidv4(),
      authenticatedAt: new Date(),
    })

    expect(data.success).toBe(true)
  })
})
