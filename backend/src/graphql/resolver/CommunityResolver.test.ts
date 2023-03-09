/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { createTestClient } from 'apollo-server-testing'
import createServer from '@/server/createServer'
import { resetEntity } from '@test/helpers'
import { Community as DbCommunity } from '@entity/Community'
import { Community } from '../model/Community'

jest.mock('@/config')

let query: any

// to do: We need a setup for the tests that closes the connection
let con: any

beforeAll(async () => {
  const server = await createServer({})
  con = server.con
  query = createTestClient(server.apollo).query
  resetEntity(DbCommunity)
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
        const result: Community[] = await query({ query: getCommunities })
        expect(result.length).decimalEqual(0)
      })
    })

    describe('only home-communities entries', () => {
      beforeEach(() => {
        const homeCom1 = DbCommunity.create()
        homeCom1.foreign = false
        homeCom1.publicKey = Buffer.from('publicKey-HomeCommunity')
        homeCom1.apiVersion = '1_0'
        homeCom1.endPoint = 'https://localhost'
        homeCom1.createdAt = new Date()
        DbCommunity.save(homeCom1)

        const homeCom2 = DbCommunity.create()
        homeCom2.foreign = false
        homeCom2.publicKey = Buffer.from('publicKey-HomeCommunity')
        homeCom2.apiVersion = '1_1'
        homeCom2.endPoint = 'https://localhost'
        homeCom2.createdAt = new Date()
        DbCommunity.save(homeCom2)

        const homeCom3 = DbCommunity.create()
        homeCom3.foreign = false
        homeCom3.publicKey = Buffer.from('publicKey-HomeCommunity')
        homeCom3.apiVersion = '2_0'
        homeCom3.endPoint = 'https://localhost'
        homeCom3.createdAt = new Date()
        DbCommunity.save(homeCom3)
      })

      it('returns three home-community entries', async () => {
        await expect(query({ query: getCommunities })).resolves.toMatchObject({
          data: {
            communities: [
              {
                id: 1,
                foreign: false,
                publicKey: expect.stringMatching(Buffer.from('publicKey-HomeCommunity').toString()),
                url: 'http://localhost/api/1_0',
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: expect.any(Date),
                updatedAt: null,
              },
              {
                id: 2,
                foreign: false,
                publicKey: expect.stringMatching(Buffer.from('publicKey-HomeCommunity').toString()),
                url: 'http://localhost/api/1_1',
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: expect.any(Date),
                updatedAt: null,
              },
              {
                id: 3,
                foreign: false,
                publicKey: expect.stringMatching(Buffer.from('publicKey-HomeCommunity').toString()),
                url: 'http://localhost/api/2_0',
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: expect.any(Date),
                updatedAt: null,
              },
            ],
          },
        })
      })
    })
  })
})
