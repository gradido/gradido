/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { createTestClient } from 'apollo-server-testing'
import createServer from '../../server/createServer'

let query: any

beforeAll(async () => {
  const { apollo } = await createServer({})

  query = createTestClient(apollo).query
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

  describe('getCommunityInfo', () => {
    it('returns the default values', async () => {
      expect(query({ query: getCommunityInfoQuery })).resolves.toMatchObject({
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
})
