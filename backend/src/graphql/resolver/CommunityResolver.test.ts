/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { createTestClient } from 'apollo-server-testing'
import createServer from '../../server/createServer'
import CONFIG from '../../config'

jest.mock('../../config')

let query: any

// to do: We need a setup for the tests that closes the connection
let con: any

beforeAll(async () => {
  const server = await createServer({})
  con = server.con
  query = createTestClient(server.apollo).query
})

afterAll(async () => {
  await con.close()
})

describe('CommunityResolver', () => {
  const getCommunityInfoQuery = `
    query {
      getCommunityInfo {
        name
        description
        url
        registerUrl
      }
    }
  `

  const communities = `
    query {
      communities {
        id
        name
        url
        description
        registerUrl
      }
    }
  `

  describe('getCommunityInfo', () => {
    it('returns the default values', async () => {
      await expect(query({ query: getCommunityInfoQuery })).resolves.toMatchObject({
        data: {
          getCommunityInfo: {
            name: 'Gradido Entwicklung',
            description: 'Die lokale Entwicklungsumgebung von Gradido.',
            url: 'http://localhost/vue/',
            registerUrl: 'http://localhost/vue/register',
          },
        },
      })
    })
  })

  describe('communities', () => {
    describe('PRODUCTION = false', () => {
      beforeEach(() => {
        CONFIG.PRODUCTION = false
      })

      it('returns three communities', async () => {
        await expect(query({ query: communities })).resolves.toMatchObject({
          data: {
            communities: [
              {
                id: 1,
                name: 'Gradido Entwicklung',
                description: 'Die lokale Entwicklungsumgebung von Gradido.',
                url: 'http://localhost/vue/',
                registerUrl: 'http://localhost/vue/register-community',
              },
              {
                id: 2,
                name: 'Gradido Staging',
                description: 'Der Testserver der Gradido-Akademie.',
                url: 'https://stage1.gradido.net/vue/',
                registerUrl: 'https://stage1.gradido.net/vue/register-community',
              },
              {
                id: 3,
                name: 'Gradido-Akademie',
                description: 'Freies Institut für Wirtschaftsbionik.',
                url: 'https://gradido.net',
                registerUrl: 'https://gdd1.gradido.com/vue/register-community',
              },
            ],
          },
        })
      })
    })

    describe('PRODUCTION = true', () => {
      beforeEach(() => {
        CONFIG.PRODUCTION = true
      })

      it('returns one community', async () => {
        await expect(query({ query: communities })).resolves.toMatchObject({
          data: {
            communities: [
              {
                id: 3,
                name: 'Gradido-Akademie',
                description: 'Freies Institut für Wirtschaftsbionik.',
                url: 'https://gradido.net',
                registerUrl: 'https://gdd1.gradido.com/vue/register-community',
              },
            ],
          },
        })
      })
    })
  })
})
