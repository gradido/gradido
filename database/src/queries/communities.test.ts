import { Community as DbCommunity } from '..'
import { AppDatabase } from '../AppDatabase'
import { getHomeCommunity, getReachableCommunities } from './communities'
import { describe, expect, it, beforeEach, beforeAll, afterAll } from 'vitest'
import { createCommunity, createAuthenticatedForeignCommunity } from '../seeds/community'

const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

describe('community.queries', () => {
  // clean db for every test case
  beforeEach(async () => {
    await DbCommunity.clear()
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
  describe('getReachableCommunities', () => {  
    it('home community counts also to reachable communities', async () => {
      await createCommunity(false)
      expect(await getReachableCommunities(1000)).toHaveLength(1)
    })
    it('foreign communities authenticated within chosen range', async () => {
      await createAuthenticatedForeignCommunity(400)
      await createAuthenticatedForeignCommunity(500)
      await createAuthenticatedForeignCommunity(1200)

      const community = await getReachableCommunities(1000)
      expect(community).toHaveLength(2)
    })
    it('foreign and home community', async () => {
      await createCommunity(false)
      await createAuthenticatedForeignCommunity(400)
      await createAuthenticatedForeignCommunity(1200)
      expect(await getReachableCommunities(1000)).toHaveLength(2)
    })
    it('not authenticated foreign community', async () => {
      await createCommunity(true)
      expect(await getReachableCommunities(1000)).toHaveLength(0)
    })
  })
})