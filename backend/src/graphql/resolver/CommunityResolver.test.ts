/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Community as DbCommunity } from '@entity/Community'
import { Community } from '../model/Community'
import { testEnvironment } from '@test/helpers'

// jest.mock('@/config')

let query: any

// to do: We need a setup for the tests that closes the connection
let con: any
let testEnv: any

beforeAll(async () => {
  testEnv = await testEnvironment()
  query = testEnv.query
  con = testEnv.con
  await DbCommunity.clear()
})

afterAll(async () => {
  await con.close()
})

describe('CommunityResolver', () => {
  const getCommunities = `
    query {
      getCommunities {
        id
        foreign
        publicKey
        url
        lastAnnouncedAt
        verifiedAt
        lastErrorAt
        createdAt
        updatedAt
      }
    }
  `

  describe('getCommunities', () => {
    describe('with empty list', () => {
      it('returns no community entry', async () => {
        // const result: Community[] = await query({ query: getCommunities })
        // expect(result.length).toEqual(0)
        await expect(query({ query: getCommunities })).resolves.toMatchObject({
          data: {
            getCommunities: [],
          },
        })
      })
    })

    describe('only home-communities entries', () => {
      let homeCom1: DbCommunity
      let homeCom2: DbCommunity
      let homeCom3: DbCommunity

      beforeEach(async () => {
        jest.clearAllMocks()
        await DbCommunity.clear()

        homeCom1 = DbCommunity.create()
        homeCom1.foreign = false
        homeCom1.publicKey = Buffer.from('publicKey-HomeCommunity')
        homeCom1.apiVersion = '1_0'
        homeCom1.endPoint = 'http://localhost'
        homeCom1.createdAt = new Date()
        await DbCommunity.insert(homeCom1)

        homeCom2 = DbCommunity.create()
        homeCom2.foreign = false
        homeCom2.publicKey = Buffer.from('publicKey-HomeCommunity')
        homeCom2.apiVersion = '1_1'
        homeCom2.endPoint = 'http://localhost'
        homeCom2.createdAt = new Date()
        await DbCommunity.insert(homeCom2)

        homeCom3 = DbCommunity.create()
        homeCom3.foreign = false
        homeCom3.publicKey = Buffer.from('publicKey-HomeCommunity')
        homeCom3.apiVersion = '2_0'
        homeCom3.endPoint = 'http://localhost'
        homeCom3.createdAt = new Date()
        await DbCommunity.insert(homeCom3)
      })

      it('returns three home-community entries', async () => {
        await expect(query({ query: getCommunities })).resolves.toMatchObject({
          data: {
            getCommunities: [
              {
                id: 1,
                foreign: homeCom1.foreign,
                publicKey: expect.stringMatching('publicKey-HomeCommunity'),
                url: expect.stringMatching('http://localhost/api/1_0'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: homeCom1.createdAt.toISOString(),
                updatedAt: null,
              },
              {
                id: 2,
                foreign: homeCom2.foreign,
                publicKey: expect.stringMatching('publicKey-HomeCommunity'),
                url: expect.stringMatching('http://localhost/api/1_1'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: homeCom2.createdAt.toISOString(),
                updatedAt: null,
              },
              {
                id: 3,
                foreign: homeCom3.foreign,
                publicKey: expect.stringMatching('publicKey-HomeCommunity'),
                url: expect.stringMatching('http://localhost/api/2_0'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: homeCom3.createdAt.toISOString(),
                updatedAt: null,
              },
            ],
          },
        })
      })
    })
  })
})
