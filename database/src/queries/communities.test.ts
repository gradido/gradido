import { Community } from '..'
import { AppDatabase } from '../AppDatabase'
import { getHomeCommunity } from './communities'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { createCommunity } from '../seeds/homeCommunity'

const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

describe('community.queries', () => {
  beforeAll(async () => {
    await Community.clear()
  })
  describe('getHomeCommunity', () => {
    it('should return null if no home community exists', async () => {
      await createCommunity(true)
      expect(await getHomeCommunity()).toBeNull()
    })
    it('should return the home community', async () => {
      const homeCom = await createCommunity(false)
      const community = await getHomeCommunity()
      expect(community).toBeDefined()
      expect(community?.name).toBe(homeCom.name)
      expect(community?.description).toBe(homeCom.description)
      expect(community?.url).toBe(homeCom.url)
      expect(community?.creationDate).toStrictEqual(homeCom.creationDate)
      expect(community?.communityUuid).toBe(homeCom.communityUuid)
      expect(community?.authenticatedAt).toStrictEqual(homeCom.authenticatedAt)
      expect(community?.foreign).toBe(homeCom.foreign)
      expect(community?.publicKey).toStrictEqual(homeCom.publicKey)
      expect(community?.privateKey).toStrictEqual(homeCom.privateKey)
    })
  })
})