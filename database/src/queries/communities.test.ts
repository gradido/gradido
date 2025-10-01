import { Community as DbCommunity, FederatedCommunity as DbFederatedCommunity } from '..'
import { AppDatabase } from '../AppDatabase'
import { getHomeCommunity, getReachableCommunities } from './communities'
import { describe, expect, it, beforeEach, beforeAll, afterAll } from 'vitest'
import { createCommunity, createVerifiedFederatedCommunity } from '../seeds/community'

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
    await DbFederatedCommunity.clear()
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
      const com1 = await createCommunity(true)
      const com2 = await createCommunity(true)
      const com3 = await createCommunity(true)
      await createVerifiedFederatedCommunity('1_0', 100, com1)
      await createVerifiedFederatedCommunity('1_0', 500, com2)
      // outside of range
      await createVerifiedFederatedCommunity('1_0', 1200, com3)

      const communities = await getReachableCommunities(1000)
      expect(communities).toHaveLength(2)
      expect(communities[0].communityUuid).toBe(com1.communityUuid)
      expect(communities[1].communityUuid).toBe(com2.communityUuid)
    })
    it('multiple federated community api version, result in one community', async () => {
      const com1 = await createCommunity(true)
      await createVerifiedFederatedCommunity('1_0', 100, com1)
      await createVerifiedFederatedCommunity('1_1', 100, com1)
      expect(await getReachableCommunities(1000)).toHaveLength(1)
    })
    it('multiple federated community api version one outside of range, result in one community', async () => {
      const com1 = await createCommunity(true)
      await createVerifiedFederatedCommunity('1_0', 100, com1)
      // outside of range
      await createVerifiedFederatedCommunity('1_1', 1200, com1)
      expect(await getReachableCommunities(1000)).toHaveLength(1)
    })
    it('foreign and home community', async () => {
      // home community
      await createCommunity(false)
      const com1 = await createCommunity(true)
      const com2 = await createCommunity(true)
      await createVerifiedFederatedCommunity('1_0', 400, com1)
      await createVerifiedFederatedCommunity('1_0', 1200, com2)
      expect(await getReachableCommunities(1000)).toHaveLength(2)
    })
    it('not verified inside time frame federated community', async () => {
      const com1 = await createCommunity(true)
      await createVerifiedFederatedCommunity('1_0', 1200, com1)
      expect(await getReachableCommunities(1000)).toHaveLength(0)
    })
  })
})