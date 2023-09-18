/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ApolloServerTestClient } from 'apollo-server-testing'
import { Community as DbCommunity } from '@entity/Community'
import CONFIG from '@/config'
import { User as DbUser } from '@entity/User'
import { fullName } from '@/graphql/util/fullName'
import { GraphQLError } from 'graphql'
import { cleanDB, testEnvironment } from '@test/helpers'
import { logger } from '@test/testSetup'
import { Connection } from '@dbTools/typeorm'

let mutate: ApolloServerTestClient['mutate'], con: Connection
// let query: ApolloServerTestClient['query']

let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: Connection
}

CONFIG.FEDERATION_API = '1_0'

beforeAll(async () => {
  testEnv = await testEnvironment(logger)
  mutate = testEnv.mutate
  //  query = testEnv.query
  con = testEnv.con

  // const server = await createServer()
  // con = server.con
  // query = createTestClient(server.apollo).query
  // mutate = createTestClient(server.apollo).mutate
  // DbCommunity.clear()
  // DbUser.clear()
  await cleanDB()
})

afterAll(async () => {
  // await cleanDB()
  await con.destroy()
})

describe('SendCoinsResolver', () => {
  const voteForSendCoinsMutation = `
  mutation (
    $communityReceiverIdentifier: String!
    $userReceiverIdentifier: String!
    $creationDate: String!
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
  const revertSendCoinsMutation = `
  mutation (
    $communityReceiverIdentifier: String!
    $userReceiverIdentifier: String!
    $creationDate: String!
    $amount: Decimal!
    $memo: String!
    $communitySenderIdentifier: String!
    $userSenderIdentifier: String!
    $userSenderName: String!
  ) {
    revertSendCoins(
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

  describe('voteForSendCoins', () => {
    let homeCom: DbCommunity
    let foreignCom: DbCommunity
    let sendUser: DbUser
    let recipUser: DbUser

    beforeEach(async () => {
      await cleanDB()
      homeCom = DbCommunity.create()
      homeCom.foreign = false
      homeCom.url = 'homeCom-url'
      homeCom.name = 'homeCom-Name'
      homeCom.description = 'homeCom-Description'
      homeCom.creationDate = new Date()
      homeCom.publicKey = Buffer.from('homeCom-publicKey')
      homeCom.communityUuid = 'homeCom-UUID'
      await DbCommunity.insert(homeCom)

      foreignCom = DbCommunity.create()
      foreignCom.foreign = true
      foreignCom.url = 'foreignCom-url'
      foreignCom.name = 'foreignCom-Name'
      foreignCom.description = 'foreignCom-Description'
      foreignCom.creationDate = new Date()
      foreignCom.publicKey = Buffer.from('foreignCom-publicKey')
      foreignCom.communityUuid = 'foreignCom-UUID'
      await DbCommunity.insert(foreignCom)

      sendUser = DbUser.create()
      sendUser.alias = 'sendUser-alias'
      sendUser.firstName = 'sendUser-FirstName'
      sendUser.gradidoID = 'sendUser-GradidoID'
      sendUser.lastName = 'sendUser-LastName'
      await DbUser.insert(sendUser)

      recipUser = DbUser.create()
      recipUser.alias = 'recipUser-alias'
      recipUser.firstName = 'recipUser-FirstName'
      recipUser.gradidoID = 'recipUser-GradidoID'
      recipUser.lastName = 'recipUser-LastName'
      await DbUser.insert(recipUser)
    })

    describe('unknown recipient community', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        expect(
          await mutate({
            mutation: voteForSendCoinsMutation,
            variables: {
              communityReceiverIdentifier: 'invalid foreignCom',
              userReceiverIdentifier: recipUser.gradidoID,
              creationDate: new Date().toISOString(),
              amount: 100,
              memo: 'X-Com-TX memo',
              communitySenderIdentifier: homeCom.communityUuid,
              userSenderIdentifier: sendUser.gradidoID,
              userSenderName: fullName(sendUser.firstName, sendUser.lastName),
            },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('voteForSendCoins with wrong communityReceiverIdentifier')],
          }),
        )
      })
    })

    describe('unknown recipient user', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        expect(
          await mutate({
            mutation: voteForSendCoinsMutation,
            variables: {
              communityReceiverIdentifier: foreignCom.communityUuid,
              userReceiverIdentifier: 'invalid recipient',
              creationDate: new Date().toISOString(),
              amount: 100,
              memo: 'X-Com-TX memo',
              communitySenderIdentifier: homeCom.communityUuid,
              userSenderIdentifier: sendUser.gradidoID,
              userSenderName: fullName(sendUser.firstName, sendUser.lastName),
            },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [
              new GraphQLError(
                'voteForSendCoins with unknown userReceiverIdentifier in the community=',
              ),
            ],
          }),
        )
      })
    })

    describe('valid X-Com-TX voted', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        expect(
          await mutate({
            mutation: voteForSendCoinsMutation,
            variables: {
              communityReceiverIdentifier: foreignCom.communityUuid,
              userReceiverIdentifier: recipUser.gradidoID,
              creationDate: new Date().toISOString(),
              amount: 100,
              memo: 'X-Com-TX memo',
              communitySenderIdentifier: homeCom.communityUuid,
              userSenderIdentifier: sendUser.gradidoID,
              userSenderName: fullName(sendUser.firstName, sendUser.lastName),
            },
          }),
        ).toEqual(
          expect.objectContaining({
            data: {
              voteForSendCoins: 'recipUser-FirstName recipUser-LastName',
            },
          }),
        )
      })
    })
  })

  describe('revertSendCoins', () => {
    let homeCom: DbCommunity
    let foreignCom: DbCommunity
    let sendUser: DbUser
    let recipUser: DbUser
    const creationDate = new Date()

    beforeEach(async () => {
      await cleanDB()
      homeCom = DbCommunity.create()
      homeCom.foreign = false
      homeCom.url = 'homeCom-url'
      homeCom.name = 'homeCom-Name'
      homeCom.description = 'homeCom-Description'
      homeCom.creationDate = new Date()
      homeCom.publicKey = Buffer.from('homeCom-publicKey')
      homeCom.communityUuid = 'homeCom-UUID'
      await DbCommunity.insert(homeCom)

      foreignCom = DbCommunity.create()
      foreignCom.foreign = true
      foreignCom.url = 'foreignCom-url'
      foreignCom.name = 'foreignCom-Name'
      foreignCom.description = 'foreignCom-Description'
      foreignCom.creationDate = new Date()
      foreignCom.publicKey = Buffer.from('foreignCom-publicKey')
      foreignCom.communityUuid = 'foreignCom-UUID'
      await DbCommunity.insert(foreignCom)

      sendUser = DbUser.create()
      sendUser.alias = 'sendUser-alias'
      sendUser.firstName = 'sendUser-FirstName'
      sendUser.gradidoID = 'sendUser-GradidoID'
      sendUser.lastName = 'sendUser-LastName'
      await DbUser.insert(sendUser)

      recipUser = DbUser.create()
      recipUser.alias = 'recipUser-alias'
      recipUser.firstName = 'recipUser-FirstName'
      recipUser.gradidoID = 'recipUser-GradidoID'
      recipUser.lastName = 'recipUser-LastName'
      await DbUser.insert(recipUser)

      await mutate({
        mutation: voteForSendCoinsMutation,
        variables: {
          communityReceiverIdentifier: foreignCom.communityUuid,
          userReceiverIdentifier: recipUser.gradidoID,
          creationDate: creationDate.toISOString(),
          amount: 100,
          memo: 'X-Com-TX memo',
          communitySenderIdentifier: homeCom.communityUuid,
          userSenderIdentifier: sendUser.gradidoID,
          userSenderName: fullName(sendUser.firstName, sendUser.lastName),
        },
      })
    })

    describe('unknown recipient community', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        expect(
          await mutate({
            mutation: revertSendCoinsMutation,
            variables: {
              communityReceiverIdentifier: 'invalid foreignCom',
              userReceiverIdentifier: recipUser.gradidoID,
              creationDate: creationDate.toISOString(),
              amount: 100,
              memo: 'X-Com-TX memo',
              communitySenderIdentifier: homeCom.communityUuid,
              userSenderIdentifier: sendUser.gradidoID,
              userSenderName: fullName(sendUser.firstName, sendUser.lastName),
            },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('revertSendCoins with wrong communityReceiverIdentifier')],
          }),
        )
      })
    })

    describe('unknown recipient user', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        expect(
          await mutate({
            mutation: revertSendCoinsMutation,
            variables: {
              communityReceiverIdentifier: foreignCom.communityUuid,
              userReceiverIdentifier: 'invalid recipient',
              creationDate: creationDate.toISOString(),
              amount: 100,
              memo: 'X-Com-TX memo',
              communitySenderIdentifier: homeCom.communityUuid,
              userSenderIdentifier: sendUser.gradidoID,
              userSenderName: fullName(sendUser.firstName, sendUser.lastName),
            },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [
              new GraphQLError(
                'revertSendCoins with unknown userReceiverIdentifier in the community=',
              ),
            ],
          }),
        )
      })
    })

    describe('valid X-Com-TX reverted', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        expect(
          await mutate({
            mutation: revertSendCoinsMutation,
            variables: {
              communityReceiverIdentifier: foreignCom.communityUuid,
              userReceiverIdentifier: recipUser.gradidoID,
              creationDate: creationDate.toISOString(),
              amount: 100,
              memo: 'X-Com-TX memo',
              communitySenderIdentifier: homeCom.communityUuid,
              userSenderIdentifier: sendUser.gradidoID,
              userSenderName: fullName(sendUser.firstName, sendUser.lastName),
            },
          }),
        ).toEqual(
          expect.objectContaining({
            data: {
              revertSendCoins: true,
            },
          }),
        )
      })
    })
  })
})
