/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/*
import { createTestClient } from 'apollo-server-testing'
import { Community as DbCommunity } from '@entity/Community'
import CONFIG from '@/config'
import { cleanDB, testEnvironment } from '@test/helpers'
import { createServer } from '@/server/createServer'

let query: any

// to do: We need a setup for the tests that closes the connection
let con: any

CONFIG.FEDERATION_API = '1_0'

beforeAll(async () => {
  const server = await createServer()
  con = server.con
  query = createTestClient(server.apollo).query
  await cleanDB()
  // DbCommunity.clear()
})

afterAll(async () => {
  await con.close()
})

describe('SendCoinsResolver', () => {
 const voteForSendCoinsMutation = `
  mutation (
    $communityReceiverIdentifier: String!
    $userReceiverIdentifier: String!
    $creationDate: Date!
    $amount: Decimal!
    $memo: String!
    $communitySenderIdentifier: String!
    $userSenderIdentifier: String!
    $userSenderName: String!
  ) {
    voteForSendCoins(
      communityReceiverIdentifier: $communityReceiverIdentifier
      userReceiverIdentifier: $userReceiverIdentifier
      creationDate: $creationDate
      amount: $amount
      memo: $memo
      communitySenderIdentifier: $communitySenderIdentifier
      userSenderIdentifier: $userSenderIdentifier
      userSenderName: $userSenderName
    )
  }
`

  describe('get 1st TX at all', () => {
    let homeCom: DbCommunity
    let foreignCom: DbCommunity
    const varsPeterLustig = {
      email: 'peter@lustig.de',
      firstName: 'Peter',
      lastName: 'Lustig',
      language: 'de',
      publisherId: 1234,
    }
    const varsBibiBloxberg = {
      email: 'bibi@bloxberg.de',
      firstName: 'Bibi',
      lastName: 'Bloxberg',
      language: 'de',
      publisherId: 1234,
    }
    beforeEach(async () => {
      homeCom = DbCommunity.create()
      homeCom.foreign = false
      homeCom.url = 'homeCommunity-url'
      homeCom.name = 'Community-Name'
      homeCom.description = 'Community-Description'
      homeCom.creationDate = new Date()
      homeCom.publicKey = Buffer.from('homeCommunity-publicKey')
      await DbCommunity.insert(homeCom)

      foreignCom = DbCommunity.create()
      foreignCom.foreign = true
      foreignCom.url = 'foreignCommunity-url'
      foreignCom.name = 'foreignCommunity-Name'
      foreignCom.description = 'foreign Community-Description'
      foreignCom.creationDate = new Date()
      foreignCom.publicKey = Buffer.from('foreignCommunity-publicKey')
      await DbCommunity.insert(foreignCom)

    })

    it('returns public CommunityInfo', async () => {
      await expect(query({ query: getPublicCommunityInfoQuery })).resolves.toMatchObject({
        data: {
          getPublicCommunityInfo: {
            name: 'Community-Name',
            description: 'Community-Description',
            creationDate: homeCom.creationDate?.toISOString(),
            publicKey: expect.stringMatching('homeCommunity-publicKey'),
          },
        },
      })
    })
  })
})
*/
