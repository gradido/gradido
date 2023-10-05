/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ApolloServerTestClient } from 'apollo-server-testing'
import { Community as DbCommunity } from '@entity/Community'
import CONFIG from '@/config'
import { User as DbUser } from '@entity/User'
import { UserContact as DbUserContact } from '@entity/UserContact'
import { fullName } from '@/graphql/util/fullName'
import { GraphQLError } from 'graphql'
import { cleanDB, testEnvironment } from '@test/helpers'
import { logger } from '@test/testSetup'
import { Connection } from '@dbTools/typeorm'
import Decimal from 'decimal.js-light'
import { SendCoinsArgs } from '../model/SendCoinsArgs'

let mutate: ApolloServerTestClient['mutate'], con: Connection
// let query: ApolloServerTestClient['query']

let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: Connection
}

CONFIG.FEDERATION_API = '1_0'

let homeCom: DbCommunity
let foreignCom: DbCommunity
let sendUser: DbUser
let sendContact: DbUserContact
let recipUser: DbUser
let recipContact: DbUserContact

beforeAll(async () => {
  testEnv = await testEnvironment(logger)
  mutate = testEnv.mutate
  //  query = testEnv.query
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  // await cleanDB()
  await con.destroy()
})

describe('SendCoinsResolver', () => {
  const voteForSendCoinsMutation = `
  mutation ($args: SendCoinsArgs!) {
    voteForSendCoins(data: $args) {
      vote
      recipGradidoID
      recipName
    }
  }`
  const settleSendCoinsMutation = `
  mutation ($args: SendCoinsArgs!) {
    settleSendCoins(data: $args)
  }`
  const revertSendCoinsMutation = `
  mutation ($args: SendCoinsArgs!) {
    revertSendCoins(data: $args)
  }`
  const revertSettledSendCoinsMutation = `
  mutation ($args: SendCoinsArgs!) {
    revertSettledSendCoins(data: $args)
  }`

  beforeEach(async () => {
    await cleanDB()
    homeCom = DbCommunity.create()
    homeCom.foreign = false
    homeCom.url = 'homeCom-url'
    homeCom.name = 'homeCom-Name'
    homeCom.description = 'homeCom-Description'
    homeCom.creationDate = new Date()
    homeCom.publicKey = Buffer.from('homeCom-publicKey')
    homeCom.communityUuid = '56a55482-909e-46a4-bfa2-cd025e894eba'
    await DbCommunity.insert(homeCom)

    foreignCom = DbCommunity.create()
    foreignCom.foreign = true
    foreignCom.url = 'foreignCom-url'
    foreignCom.name = 'foreignCom-Name'
    foreignCom.description = 'foreignCom-Description'
    foreignCom.creationDate = new Date()
    foreignCom.publicKey = Buffer.from('foreignCom-publicKey')
    foreignCom.communityUuid = '56a55482-909e-46a4-bfa2-cd025e894ebb'
    await DbCommunity.insert(foreignCom)

    sendUser = DbUser.create()
    sendUser.alias = 'sendUser-alias'
    sendUser.firstName = 'sendUser-FirstName'
    sendUser.gradidoID = '56a55482-909e-46a4-bfa2-cd025e894ebc'
    sendUser.lastName = 'sendUser-LastName'
    await DbUser.insert(sendUser)

    sendContact = await newEmailContact('send.user@email.de', sendUser.id)
    sendContact = await DbUserContact.save(sendContact)

    sendUser.emailContact = sendContact
    sendUser.emailId = sendContact.id
    await DbUser.save(sendUser)

    recipUser = DbUser.create()
    recipUser.alias = 'recipUser-alias'
    recipUser.firstName = 'recipUser-FirstName'
    recipUser.gradidoID = '56a55482-909e-46a4-bfa2-cd025e894ebd'
    recipUser.lastName = 'recipUser-LastName'
    await DbUser.insert(recipUser)

    recipContact = await newEmailContact('recip.user@email.de', recipUser.id)
    recipContact = await DbUserContact.save(recipContact)

    recipUser.emailContact = recipContact
    recipUser.emailId = recipContact.id
    await DbUser.save(recipUser)
  })

  describe('voteForSendCoins', () => {
    describe('unknown recipient community', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const args = new SendCoinsArgs()
        args.recipientCommunityUuid = 'invalid foreignCom'
        args.recipientUserIdentifier = recipUser.gradidoID
        args.creationDate = new Date().toISOString()
        args.amount = new Decimal(100)
        args.memo = 'X-Com-TX memo'
        if (homeCom.communityUuid) {
          args.senderCommunityUuid = homeCom.communityUuid
        }
        args.senderUserUuid = sendUser.gradidoID
        args.senderUserName = fullName(sendUser.firstName, sendUser.lastName)
        expect(
          await mutate({
            mutation: voteForSendCoinsMutation,
            variables: { args },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('voteForSendCoins with wrong recipientCommunityUuid')],
          }),
        )
      })
    })

    describe('unknown recipient user', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const args = new SendCoinsArgs()
        if (foreignCom.communityUuid) {
          args.recipientCommunityUuid = foreignCom.communityUuid
        }
        args.recipientUserIdentifier = 'invalid recipient'
        args.creationDate = new Date().toISOString()
        args.amount = new Decimal(100)
        args.memo = 'X-Com-TX memo'
        if (homeCom.communityUuid) {
          args.senderCommunityUuid = homeCom.communityUuid
        }
        args.senderUserUuid = sendUser.gradidoID
        args.senderUserName = fullName(sendUser.firstName, sendUser.lastName)
        expect(
          await mutate({
            mutation: voteForSendCoinsMutation,
            variables: { args },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [
              new GraphQLError(
                'voteForSendCoins with unknown recipientUserIdentifier in the community=',
              ),
            ],
          }),
        )
      })
    })

    describe('valid X-Com-TX voted', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const args = new SendCoinsArgs()
        if (foreignCom.communityUuid) {
          args.recipientCommunityUuid = foreignCom.communityUuid
        }
        args.recipientUserIdentifier = recipUser.gradidoID
        args.creationDate = new Date().toISOString()
        args.amount = new Decimal(100)
        args.memo = 'X-Com-TX memo'
        if (homeCom.communityUuid) {
          args.senderCommunityUuid = homeCom.communityUuid
        }
        args.senderUserUuid = sendUser.gradidoID
        args.senderUserName = fullName(sendUser.firstName, sendUser.lastName)
        expect(
          await mutate({
            mutation: voteForSendCoinsMutation,
            variables: { args },
          }),
        ).toEqual(
          expect.objectContaining({
            data: {
              voteForSendCoins: {
                recipGradidoID: '56a55482-909e-46a4-bfa2-cd025e894ebd',
                recipName: 'recipUser-FirstName recipUser-LastName',
                vote: true,
              },
            },
          }),
        )
      })
    })
  })

  describe('revertSendCoins', () => {
    const creationDate = new Date()

    beforeEach(async () => {
      const args = new SendCoinsArgs()
      if (foreignCom.communityUuid) {
        args.recipientCommunityUuid = foreignCom.communityUuid
      }
      args.recipientUserIdentifier = recipUser.gradidoID
      args.creationDate = creationDate.toISOString()
      args.amount = new Decimal(100)
      args.memo = 'X-Com-TX memo'
      if (homeCom.communityUuid) {
        args.senderCommunityUuid = homeCom.communityUuid
      }
      args.senderUserUuid = sendUser.gradidoID
      args.senderUserName = fullName(sendUser.firstName, sendUser.lastName)
      await mutate({
        mutation: voteForSendCoinsMutation,
        variables: { args },
      })
    })

    describe('unknown recipient community', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const args = new SendCoinsArgs()
        args.recipientCommunityUuid = 'invalid foreignCom'
        args.recipientUserIdentifier = recipUser.gradidoID
        args.creationDate = creationDate.toISOString()
        args.amount = new Decimal(100)
        args.memo = 'X-Com-TX memo'
        if (homeCom.communityUuid) {
          args.senderCommunityUuid = homeCom.communityUuid
        }
        args.senderUserUuid = sendUser.gradidoID
        args.senderUserName = fullName(sendUser.firstName, sendUser.lastName)
        expect(
          await mutate({
            mutation: revertSendCoinsMutation,
            variables: { args },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('revertSendCoins with wrong recipientCommunityUuid')],
          }),
        )
      })
    })

    describe('unknown recipient user', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const args = new SendCoinsArgs()
        if (foreignCom.communityUuid) {
          args.recipientCommunityUuid = foreignCom.communityUuid
        }
        args.recipientUserIdentifier = 'invalid recipient'
        args.creationDate = creationDate.toISOString()
        args.amount = new Decimal(100)
        args.memo = 'X-Com-TX memo'
        if (homeCom.communityUuid) {
          args.senderCommunityUuid = homeCom.communityUuid
        }
        args.senderUserUuid = sendUser.gradidoID
        args.senderUserName = fullName(sendUser.firstName, sendUser.lastName)
        expect(
          await mutate({
            mutation: revertSendCoinsMutation,
            variables: { args },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [
              new GraphQLError(
                'revertSendCoins with unknown recipientUserIdentifier in the community=',
              ),
            ],
          }),
        )
      })
    })

    describe('valid X-Com-TX reverted', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const args = new SendCoinsArgs()
        if (foreignCom.communityUuid) {
          args.recipientCommunityUuid = foreignCom.communityUuid
        }
        args.recipientUserIdentifier = recipUser.gradidoID
        args.creationDate = creationDate.toISOString()
        args.amount = new Decimal(100)
        args.memo = 'X-Com-TX memo'
        if (homeCom.communityUuid) {
          args.senderCommunityUuid = homeCom.communityUuid
        }
        args.senderUserUuid = sendUser.gradidoID
        args.senderUserName = fullName(sendUser.firstName, sendUser.lastName)
        expect(
          await mutate({
            mutation: revertSendCoinsMutation,
            variables: { args },
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

  describe('settleSendCoins', () => {
    const creationDate = new Date()

    beforeEach(async () => {
      const args = new SendCoinsArgs()
      if (foreignCom.communityUuid) {
        args.recipientCommunityUuid = foreignCom.communityUuid
      }
      args.recipientUserIdentifier = recipUser.gradidoID
      args.creationDate = creationDate.toISOString()
      args.amount = new Decimal(100)
      args.memo = 'X-Com-TX memo'
      if (homeCom.communityUuid) {
        args.senderCommunityUuid = homeCom.communityUuid
      }
      args.senderUserUuid = sendUser.gradidoID
      args.senderUserName = fullName(sendUser.firstName, sendUser.lastName)
      await mutate({
        mutation: voteForSendCoinsMutation,
        variables: { args },
      })
    })

    describe('unknown recipient community', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const args = new SendCoinsArgs()
        args.recipientCommunityUuid = 'invalid foreignCom'
        args.recipientUserIdentifier = recipUser.gradidoID
        args.creationDate = creationDate.toISOString()
        args.amount = new Decimal(100)
        args.memo = 'X-Com-TX memo'
        if (homeCom.communityUuid) {
          args.senderCommunityUuid = homeCom.communityUuid
        }
        args.senderUserUuid = sendUser.gradidoID
        args.senderUserName = fullName(sendUser.firstName, sendUser.lastName)
        expect(
          await mutate({
            mutation: settleSendCoinsMutation,
            variables: { args },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('settleSendCoins with wrong recipientCommunityUuid')],
          }),
        )
      })
    })

    describe('unknown recipient user', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const args = new SendCoinsArgs()
        if (foreignCom.communityUuid) {
          args.recipientCommunityUuid = foreignCom.communityUuid
        }
        args.recipientUserIdentifier = 'invalid recipient'
        args.creationDate = creationDate.toISOString()
        args.amount = new Decimal(100)
        args.memo = 'X-Com-TX memo'
        if (homeCom.communityUuid) {
          args.senderCommunityUuid = homeCom.communityUuid
        }
        args.senderUserUuid = sendUser.gradidoID
        args.senderUserName = fullName(sendUser.firstName, sendUser.lastName)
        expect(
          await mutate({
            mutation: settleSendCoinsMutation,
            variables: { args },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [
              new GraphQLError(
                'settleSendCoins with unknown recipientUserIdentifier in the community=',
              ),
            ],
          }),
        )
      })
    })

    describe('valid X-Com-TX settled', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const args = new SendCoinsArgs()
        if (foreignCom.communityUuid) {
          args.recipientCommunityUuid = foreignCom.communityUuid
        }
        args.recipientUserIdentifier = recipUser.gradidoID
        args.creationDate = creationDate.toISOString()
        args.amount = new Decimal(100)
        args.memo = 'X-Com-TX memo'
        if (homeCom.communityUuid) {
          args.senderCommunityUuid = homeCom.communityUuid
        }
        args.senderUserUuid = sendUser.gradidoID
        args.senderUserName = fullName(sendUser.firstName, sendUser.lastName)
        expect(
          await mutate({
            mutation: settleSendCoinsMutation,
            variables: { args },
          }),
        ).toEqual(
          expect.objectContaining({
            data: {
              settleSendCoins: true,
            },
          }),
        )
      })
    })
  })

  describe('revertSettledSendCoins', () => {
    const creationDate = new Date()

    beforeEach(async () => {
      const args = new SendCoinsArgs()
      if (foreignCom.communityUuid) {
        args.recipientCommunityUuid = foreignCom.communityUuid
      }
      args.recipientUserIdentifier = recipUser.gradidoID
      args.creationDate = creationDate.toISOString()
      args.amount = new Decimal(100)
      args.memo = 'X-Com-TX memo'
      if (homeCom.communityUuid) {
        args.senderCommunityUuid = homeCom.communityUuid
      }
      args.senderUserUuid = sendUser.gradidoID
      args.senderUserName = fullName(sendUser.firstName, sendUser.lastName)
      await mutate({
        mutation: voteForSendCoinsMutation,
        variables: { args },
      })
      await mutate({
        mutation: settleSendCoinsMutation,
        variables: { args },
      })
    })

    describe('unknown recipient community', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const args = new SendCoinsArgs()
        args.recipientCommunityUuid = 'invalid foreignCom'
        args.recipientUserIdentifier = recipUser.gradidoID
        args.creationDate = creationDate.toISOString()
        args.amount = new Decimal(100)
        args.memo = 'X-Com-TX memo'
        if (homeCom.communityUuid) {
          args.senderCommunityUuid = homeCom.communityUuid
        }
        args.senderUserUuid = sendUser.gradidoID
        args.senderUserName = fullName(sendUser.firstName, sendUser.lastName)
        expect(
          await mutate({
            mutation: revertSettledSendCoinsMutation,
            variables: { args },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('revertSettledSendCoins with wrong recipientCommunityUuid')],
          }),
        )
      })
    })

    describe('unknown recipient user', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const args = new SendCoinsArgs()
        if (foreignCom.communityUuid) {
          args.recipientCommunityUuid = foreignCom.communityUuid
        }
        args.recipientUserIdentifier = 'invalid recipient'
        args.creationDate = creationDate.toISOString()
        args.amount = new Decimal(100)
        args.memo = 'X-Com-TX memo'
        if (homeCom.communityUuid) {
          args.senderCommunityUuid = homeCom.communityUuid
        }
        args.senderUserUuid = sendUser.gradidoID
        args.senderUserName = fullName(sendUser.firstName, sendUser.lastName)
        expect(
          await mutate({
            mutation: revertSettledSendCoinsMutation,
            variables: { args },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [
              new GraphQLError(
                'revertSettledSendCoins with unknown recipientUserIdentifier in the community=',
              ),
            ],
          }),
        )
      })
    })

    describe('valid X-Com-TX settled', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const args = new SendCoinsArgs()
        if (foreignCom.communityUuid) {
          args.recipientCommunityUuid = foreignCom.communityUuid
        }
        args.recipientUserIdentifier = recipUser.gradidoID
        args.creationDate = creationDate.toISOString()
        args.amount = new Decimal(100)
        args.memo = 'X-Com-TX memo'
        if (homeCom.communityUuid) {
          args.senderCommunityUuid = homeCom.communityUuid
        }
        args.senderUserUuid = sendUser.gradidoID
        args.senderUserName = fullName(sendUser.firstName, sendUser.lastName)
        expect(
          await mutate({
            mutation: revertSettledSendCoinsMutation,
            variables: { args },
          }),
        ).toEqual(
          expect.objectContaining({
            data: {
              revertSettledSendCoins: true,
            },
          }),
        )
      })
    })
  })
})

async function newEmailContact(email: string, userId: number): Promise<DbUserContact> {
  const emailContact = new DbUserContact()
  emailContact.email = email
  emailContact.userId = userId
  emailContact.type = 'EMAIL'
  emailContact.emailChecked = false
  emailContact.emailOptInTypeId = 1
  emailContact.emailVerificationCode = '1' + userId
  return emailContact
}
