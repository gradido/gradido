import { cleanDB, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { EncryptedTransferArgs } from 'core'
import { Community as DbCommunity, User as DbUser, UserContact as DbUserContact } from 'database'
import Decimal from 'decimal.js-light'
import { GraphQLError } from 'graphql'
import { getLogger } from 'log4js'
import {
  createKeyPair,
  encryptAndSign,
  SendCoinsJwtPayloadType,
  SendCoinsResponseJwtPayloadType,
  verifyAndDecrypt,
} from 'shared'
import { DataSource } from 'typeorm'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { fullName } from '@/graphql/util/fullName'

let mutate: ApolloServerTestClient['mutate'] // , con: Connection
// let query: ApolloServerTestClient['query']

let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: DataSource
}

CONFIG.FEDERATION_API = '1_0'

let recipientCom: DbCommunity
let senderCom: DbCommunity
let sendUser: DbUser
let sendContact: DbUserContact
let recipUser: DbUser
let recipContact: DbUserContact

beforeAll(async () => {
  testEnv = await testEnvironment(getLogger('apollo'))
  mutate = testEnv.mutate
  //  query = testEnv.query
  // con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  if (testEnv.con?.isInitialized) {
    await testEnv.con.destroy()
  }
})

describe('SendCoinsResolver', () => {
  const voteForSendCoinsMutation = `
  mutation ($args: EncryptedTransferArgs!) {
    voteForSendCoins(data: $args)
  }`
  const settleSendCoinsMutation = `
  mutation ($args: EncryptedTransferArgs!) {
    settleSendCoins(data: $args)
  }`
  const revertSendCoinsMutation = `
  mutation ($args: EncryptedTransferArgs!) {
    revertSendCoins(data: $args)
  }`
  const revertSettledSendCoinsMutation = `
  mutation ($args: EncryptedTransferArgs!) {
    revertSettledSendCoins(data: $args)
  }`

  beforeEach(async () => {
    await cleanDB()
    // Generate key pair using jose library
    const { publicKey: homePublicKey, privateKey: homePrivateKey } = await createKeyPair()
    recipientCom = DbCommunity.create()
    recipientCom.foreign = false
    recipientCom.url = 'homeCom-url'
    recipientCom.name = 'homeCom-Name'
    recipientCom.description = 'homeCom-Description'
    recipientCom.creationDate = new Date()
    recipientCom.publicKey = Buffer.alloc(
      32,
      '15F92F8EC2EA685D5FD51EE3588F5B4805EBD330EF9EDD16043F3BA9C35C0D91',
      'hex',
    ) // 'homeCom-publicKey', 'hex')
    recipientCom.publicJwtKey = homePublicKey
    recipientCom.privateJwtKey = homePrivateKey
    recipientCom.communityUuid = '56a55482-909e-46a4-bfa2-cd025e894eba'
    await DbCommunity.insert(recipientCom)

    const { publicKey: foreignPublicKey, privateKey: foreignPrivateKey } = await createKeyPair()
    senderCom = DbCommunity.create()
    senderCom.foreign = true
    senderCom.url = 'foreignCom-url'
    senderCom.name = 'foreignCom-Name'
    senderCom.description = 'foreignCom-Description'
    senderCom.creationDate = new Date()
    senderCom.publicKey = Buffer.alloc(
      32,
      '15F92F8EC2EA685D5FD51EE3588F5B4805EBD330EF9EDD16043F3BA9C35C0D92',
      'hex',
    ) // 'foreignCom-publicKey', 'hex')
    senderCom.publicJwtKey = foreignPublicKey
    senderCom.privateJwtKey = foreignPrivateKey
    senderCom.communityUuid = '56a55482-909e-46a4-bfa2-cd025e894ebb'
    await DbCommunity.insert(senderCom)

    sendUser = DbUser.create()
    sendUser.alias = 'sendUser-alias'
    sendUser.communityUuid = '56a55482-909e-46a4-bfa2-cd025e894ebb'
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
    recipUser.communityUuid = '56a55482-909e-46a4-bfa2-cd025e894eba'
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
        const payload = new SendCoinsJwtPayloadType(
          'handshakeID',
          'invalid recipientCom',
          recipUser.gradidoID,
          new Date().toISOString(),
          new Decimal(100),
          'X-Com-TX memo',
          senderCom.communityUuid!,
          sendUser.gradidoID,
          fullName(sendUser.firstName, sendUser.lastName),
          sendUser.alias,
        )
        // invoke encryption as beeing on the foreignCom side to find in voteForSendCoins the correct homeCom
        const jws = await encryptAndSign(
          payload,
          senderCom.privateJwtKey!,
          recipientCom.publicJwtKey!,
        )
        const args = new EncryptedTransferArgs()
        args.publicKey = senderCom.publicKey.toString('hex')
        args.jwt = jws
        args.handshakeID = 'handshakeID'
        const graphQLResponse = await mutate({
          mutation: voteForSendCoinsMutation,
          variables: { args },
        })
        expect(graphQLResponse).toEqual(
          expect.objectContaining({
            errors: [
              new GraphQLError(
                'voteForSendCoins with wrong recipientCommunityUuid: invalid recipientCom',
              ),
            ],
          }),
        )
      })
    })

    describe('unknown recipient user', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()

        const payload = new SendCoinsJwtPayloadType(
          'handshakeID',
          recipientCom.communityUuid!,
          'invalid recipient',
          new Date().toISOString(),
          new Decimal(100),
          'X-Com-TX memo',
          senderCom.communityUuid!,
          sendUser.gradidoID,
          fullName(sendUser.firstName, sendUser.lastName),
          sendUser.alias,
        )
        // invoke encryption as beeing on the foreignCom side to find in voteForSendCoins the correct homeCom
        const jws = await encryptAndSign(
          payload,
          senderCom.privateJwtKey!,
          recipientCom.publicJwtKey!,
        )
        const args = new EncryptedTransferArgs()
        args.publicKey = senderCom.publicKey.toString('hex')
        args.jwt = jws
        args.handshakeID = 'handshakeID'
        expect(
          await mutate({
            mutation: voteForSendCoinsMutation,
            variables: { args },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [
              new GraphQLError(
                'voteForSendCoins with unknown recipientUserIdentifier in the community=homeCom-Name',
              ),
            ],
          }),
        )
      })
    })

    describe('valid X-Com-TX voted per gradidoID', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()

        const payload = new SendCoinsJwtPayloadType(
          'handshakeID',
          recipientCom.communityUuid!,
          recipUser.gradidoID,
          new Date().toISOString(),
          new Decimal(100),
          'X-Com-TX memo',
          senderCom.communityUuid!,
          sendUser.gradidoID,
          fullName(sendUser.firstName, sendUser.lastName),
          sendUser.alias,
        )
        // invoke encryption as beeing on the foreignCom side to find in voteForSendCoins the correct homeCom
        const jws = await encryptAndSign(
          payload,
          senderCom.privateJwtKey!,
          recipientCom.publicJwtKey!,
        )
        const args = new EncryptedTransferArgs()
        args.publicKey = senderCom.publicKey.toString('hex')
        args.jwt = jws
        args.handshakeID = 'handshakeID'
        const responseJwt = await mutate({
          mutation: voteForSendCoinsMutation,
          variables: { args },
        })
        const voteResult = (await verifyAndDecrypt(
          'handshakeID',
          responseJwt.data.voteForSendCoins,
          senderCom.privateJwtKey!,
          recipientCom.publicJwtKey!,
        )) as SendCoinsResponseJwtPayloadType
        expect(voteResult).toEqual(
          expect.objectContaining({
            expiration: '10m',
            handshakeID: 'handshakeID',
            recipGradidoID: '56a55482-909e-46a4-bfa2-cd025e894ebd',
            recipFirstName: 'recipUser-FirstName',
            recipLastName: 'recipUser-LastName',
            recipAlias: 'recipUser-alias',
            tokentype: SendCoinsResponseJwtPayloadType.SEND_COINS_RESPONSE_TYPE,
            vote: true,
          }),
        )
      })
    })

    describe('valid X-Com-TX voted per alias', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()

        const payload = new SendCoinsJwtPayloadType(
          'handshakeID',
          recipientCom.communityUuid!,
          recipUser.alias,
          new Date().toISOString(),
          new Decimal(100),
          'X-Com-TX memo',
          senderCom.communityUuid!,
          sendUser.gradidoID,
          fullName(sendUser.firstName, sendUser.lastName),
          sendUser.alias,
        )
        // invoke encryption as beeing on the foreignCom side to find in voteForSendCoins the correct homeCom
        const jws = await encryptAndSign(
          payload,
          senderCom.privateJwtKey!,
          recipientCom.publicJwtKey!,
        )
        const args = new EncryptedTransferArgs()
        args.publicKey = senderCom.publicKey.toString('hex')
        args.jwt = jws
        args.handshakeID = 'handshakeID'
        const responseJwt = await mutate({
          mutation: voteForSendCoinsMutation,
          variables: { args },
        })
        const voteResult = (await verifyAndDecrypt(
          'handshakeID',
          responseJwt.data.voteForSendCoins,
          senderCom.privateJwtKey!,
          recipientCom.publicJwtKey!,
        )) as SendCoinsResponseJwtPayloadType
        expect(voteResult).toEqual(
          expect.objectContaining({
            recipGradidoID: '56a55482-909e-46a4-bfa2-cd025e894ebd',
            recipFirstName: 'recipUser-FirstName',
            recipLastName: 'recipUser-LastName',
            recipAlias: 'recipUser-alias',
            vote: true,
          }),
        )
      })
    })

    describe('valid X-Com-TX voted per email', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()

        const payload = new SendCoinsJwtPayloadType(
          'handshakeID',
          recipientCom.communityUuid!,
          recipContact.email,
          new Date().toISOString(),
          new Decimal(100),
          'X-Com-TX memo',
          senderCom.communityUuid!,
          sendUser.gradidoID,
          fullName(sendUser.firstName, sendUser.lastName),
          sendUser.alias,
        )
        // invoke encryption as beeing on the foreignCom side to find in voteForSendCoins the correct homeCom
        const jws = await encryptAndSign(
          payload,
          senderCom.privateJwtKey!,
          recipientCom.publicJwtKey!,
        )
        const args = new EncryptedTransferArgs()
        args.publicKey = senderCom.publicKey.toString('hex')
        args.jwt = jws
        args.handshakeID = 'handshakeID'
        const responseJwt = await mutate({
          mutation: voteForSendCoinsMutation,
          variables: { args },
        })
        const voteResult = (await verifyAndDecrypt(
          'handshakeID',
          responseJwt.data.voteForSendCoins,
          senderCom.privateJwtKey!,
          recipientCom.publicJwtKey!,
        )) as SendCoinsResponseJwtPayloadType
        expect(voteResult).toEqual(
          expect.objectContaining({
            recipGradidoID: '56a55482-909e-46a4-bfa2-cd025e894ebd',
            recipFirstName: 'recipUser-FirstName',
            recipLastName: 'recipUser-LastName',
            recipAlias: 'recipUser-alias',
            vote: true,
          }),
        )
      })
    })
  })

  describe('revertSendCoins', () => {
    const creationDate = new Date()

    beforeEach(async () => {
      const payload = new SendCoinsJwtPayloadType(
        'handshakeID',
        recipientCom.communityUuid!,
        recipUser.gradidoID,
        creationDate.toISOString(),
        new Decimal(100),
        'X-Com-TX memo',
        senderCom.communityUuid!,
        sendUser.gradidoID,
        fullName(sendUser.firstName, sendUser.lastName),
        sendUser.alias,
      )
      // invoke encryption as beeing on the foreignCom side to find in voteForSendCoins the correct homeCom
      const jws = await encryptAndSign(
        payload,
        senderCom.privateJwtKey!,
        recipientCom.publicJwtKey!,
      )
      const args = new EncryptedTransferArgs()
      args.publicKey = senderCom.publicKey.toString('hex')
      args.jwt = jws
      args.handshakeID = 'handshakeID'
      await mutate({
        mutation: voteForSendCoinsMutation,
        variables: { args },
      })
    })

    describe('unknown recipient community', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()

        const payload = new SendCoinsJwtPayloadType(
          'handshakeID',
          'invalid recipientCom',
          recipUser.gradidoID,
          creationDate.toISOString(),
          new Decimal(100),
          'X-Com-TX memo',
          senderCom.communityUuid!,
          sendUser.gradidoID,
          fullName(sendUser.firstName, sendUser.lastName),
          sendUser.alias,
        )
        // invoke encryption as beeing on the foreignCom side to find in voteForSendCoins the correct homeCom
        const jws = await encryptAndSign(
          payload,
          senderCom.privateJwtKey!,
          recipientCom.publicJwtKey!,
        )
        const args = new EncryptedTransferArgs()
        args.publicKey = senderCom.publicKey.toString('hex')
        args.jwt = jws
        args.handshakeID = 'handshakeID'
        expect(
          await mutate({
            mutation: revertSendCoinsMutation,
            variables: { args },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [
              new GraphQLError(
                'revertSendCoins with wrong recipientCommunityUuid=invalid recipientCom',
              ),
            ],
          }),
        )
      })
    })

    describe('unknown recipient user', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()

        const payload = new SendCoinsJwtPayloadType(
          'handshakeID',
          recipientCom.communityUuid!,
          'invalid recipient',
          creationDate.toISOString(),
          new Decimal(100),
          'X-Com-TX memo',
          senderCom.communityUuid!,
          sendUser.gradidoID,
          fullName(sendUser.firstName, sendUser.lastName),
          sendUser.alias,
        )
        // invoke encryption as beeing on the foreignCom side to find in voteForSendCoins the correct homeCom
        const jws = await encryptAndSign(
          payload,
          senderCom.privateJwtKey!,
          recipientCom.publicJwtKey!,
        )
        const args = new EncryptedTransferArgs()
        args.publicKey = senderCom.publicKey.toString('hex')
        args.jwt = jws
        args.handshakeID = 'handshakeID'
        expect(
          await mutate({
            mutation: revertSendCoinsMutation,
            variables: { args },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [
              new GraphQLError(
                'revertSendCoins with unknown recipientUserIdentifier in the community=homeCom-Name',
              ),
            ],
          }),
        )
      })
    })

    describe('valid X-Com-TX reverted', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()

        const payload = new SendCoinsJwtPayloadType(
          'handshakeID',
          recipientCom.communityUuid!,
          recipUser.gradidoID,
          creationDate.toISOString(),
          new Decimal(100),
          'X-Com-TX memo',
          senderCom.communityUuid!,
          sendUser.gradidoID,
          fullName(sendUser.firstName, sendUser.lastName),
          sendUser.alias,
        )
        // invoke encryption as beeing on the foreignCom side to find in voteForSendCoins the correct homeCom
        const jws = await encryptAndSign(
          payload,
          senderCom.privateJwtKey!,
          recipientCom.publicJwtKey!,
        )
        const args = new EncryptedTransferArgs()
        args.publicKey = senderCom.publicKey.toString('hex')
        args.jwt = jws
        args.handshakeID = 'handshakeID'

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
      const payload = new SendCoinsJwtPayloadType(
        'handshakeID',
        recipientCom.communityUuid!,
        recipUser.gradidoID,
        creationDate.toISOString(),
        new Decimal(100),
        'X-Com-TX memo',
        senderCom.communityUuid!,
        sendUser.gradidoID,
        fullName(sendUser.firstName, sendUser.lastName),
        sendUser.alias,
      )
      // invoke encryption as beeing on the foreignCom side to find in voteForSendCoins the correct homeCom
      const jws = await encryptAndSign(
        payload,
        senderCom.privateJwtKey!,
        recipientCom.publicJwtKey!,
      )
      const args = new EncryptedTransferArgs()
      args.publicKey = senderCom.publicKey.toString('hex')
      args.jwt = jws
      args.handshakeID = 'handshakeID'

      await mutate({
        mutation: voteForSendCoinsMutation,
        variables: { args },
      })
    })

    describe('unknown recipient community', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const payload = new SendCoinsJwtPayloadType(
          'handshakeID',
          'invalid recipientCom',
          recipUser.gradidoID,
          creationDate.toISOString(),
          new Decimal(100),
          'X-Com-TX memo',
          senderCom.communityUuid!,
          sendUser.gradidoID,
          fullName(sendUser.firstName, sendUser.lastName),
          sendUser.alias,
        )
        // invoke encryption as beeing on the foreignCom side to find in voteForSendCoins the correct homeCom
        const jws = await encryptAndSign(
          payload,
          senderCom.privateJwtKey!,
          recipientCom.publicJwtKey!,
        )
        const args = new EncryptedTransferArgs()
        args.publicKey = senderCom.publicKey.toString('hex')
        args.jwt = jws
        args.handshakeID = 'handshakeID'
        expect(
          await mutate({
            mutation: settleSendCoinsMutation,
            variables: { args },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [
              new GraphQLError(
                'settleSendCoins with wrong recipientCommunityUuid=invalid recipientCom',
              ),
            ],
          }),
        )
      })
    })

    describe('unknown recipient user', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const payload = new SendCoinsJwtPayloadType(
          'handshakeID',
          recipientCom.communityUuid!,
          'invalid recipient',
          creationDate.toISOString(),
          new Decimal(100),
          'X-Com-TX memo',
          senderCom.communityUuid!,
          sendUser.gradidoID,
          fullName(sendUser.firstName, sendUser.lastName),
          sendUser.alias,
        )
        // invoke encryption as beeing on the foreignCom side to find in voteForSendCoins the correct homeCom
        const jws = await encryptAndSign(
          payload,
          senderCom.privateJwtKey!,
          recipientCom.publicJwtKey!,
        )
        const args = new EncryptedTransferArgs()
        args.publicKey = senderCom.publicKey.toString('hex')
        args.jwt = jws
        args.handshakeID = 'handshakeID'
        expect(
          await mutate({
            mutation: settleSendCoinsMutation,
            variables: { args },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [
              new GraphQLError(
                'settleSendCoins with unknown recipientUserIdentifier in the community=' +
                  recipientCom.name,
              ),
            ],
          }),
        )
      })
    })

    describe('valid X-Com-TX settled', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const payload = new SendCoinsJwtPayloadType(
          'handshakeID',
          recipientCom.communityUuid!,
          recipUser.gradidoID,
          creationDate.toISOString(),
          new Decimal(100),
          'X-Com-TX memo',
          senderCom.communityUuid!,
          sendUser.gradidoID,
          fullName(sendUser.firstName, sendUser.lastName),
          sendUser.alias,
        )
        // invoke encryption as beeing on the foreignCom side to find in voteForSendCoins the correct homeCom
        const jws = await encryptAndSign(
          payload,
          senderCom.privateJwtKey!,
          recipientCom.publicJwtKey!,
        )
        const args = new EncryptedTransferArgs()
        args.publicKey = senderCom.publicKey.toString('hex')
        args.jwt = jws
        args.handshakeID = 'handshakeID'
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
      const payload = new SendCoinsJwtPayloadType(
        'handshakeID',
        recipientCom.communityUuid!,
        recipUser.gradidoID,
        creationDate.toISOString(),
        new Decimal(100),
        'X-Com-TX memo',
        senderCom.communityUuid!,
        sendUser.gradidoID,
        fullName(sendUser.firstName, sendUser.lastName),
        sendUser.alias,
      )
      // invoke encryption as beeing on the foreignCom side to find in voteForSendCoins the correct homeCom
      const jws = await encryptAndSign(
        payload,
        senderCom.privateJwtKey!,
        recipientCom.publicJwtKey!,
      )
      const args = new EncryptedTransferArgs()
      args.publicKey = senderCom.publicKey.toString('hex')
      args.jwt = jws
      args.handshakeID = 'handshakeID'
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
        const payload = new SendCoinsJwtPayloadType(
          'handshakeID',
          'invalid recipientCom',
          recipUser.gradidoID,
          creationDate.toISOString(),
          new Decimal(100),
          'X-Com-TX memo',
          senderCom.communityUuid!,
          sendUser.gradidoID,
          fullName(sendUser.firstName, sendUser.lastName),
          sendUser.alias,
        )
        // invoke encryption as beeing on the foreignCom side to find in voteForSendCoins the correct homeCom
        const jws = await encryptAndSign(
          payload,
          senderCom.privateJwtKey!,
          recipientCom.publicJwtKey!,
        )
        const args = new EncryptedTransferArgs()
        args.publicKey = senderCom.publicKey.toString('hex')
        args.jwt = jws
        args.handshakeID = 'handshakeID'
        expect(
          await mutate({
            mutation: revertSettledSendCoinsMutation,
            variables: { args },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [
              new GraphQLError(
                'revertSettledSendCoins with wrong recipientCommunityUuid=invalid recipientCom',
              ),
            ],
          }),
        )
      })
    })

    describe('unknown recipient user', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const payload = new SendCoinsJwtPayloadType(
          'handshakeID',
          recipientCom.communityUuid!,
          'invalid recipient',
          creationDate.toISOString(),
          new Decimal(100),
          'X-Com-TX memo',
          senderCom.communityUuid!,
          sendUser.gradidoID,
          fullName(sendUser.firstName, sendUser.lastName),
          sendUser.alias,
        )
        // invoke encryption as beeing on the foreignCom side to find in voteForSendCoins the correct homeCom
        const jws = await encryptAndSign(
          payload,
          senderCom.privateJwtKey!,
          recipientCom.publicJwtKey!,
        )
        const args = new EncryptedTransferArgs()
        args.publicKey = senderCom.publicKey.toString('hex')
        args.jwt = jws
        args.handshakeID = 'handshakeID'
        expect(
          await mutate({
            mutation: revertSettledSendCoinsMutation,
            variables: { args },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [
              new GraphQLError(
                'revertSettledSendCoins with unknown recipientUserIdentifier in the community=' +
                  recipientCom.name,
              ),
            ],
          }),
        )
      })
    })

    describe('valid X-Com-TX settled', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const payload = new SendCoinsJwtPayloadType(
          'handshakeID',
          recipientCom.communityUuid!,
          recipUser.gradidoID,
          creationDate.toISOString(),
          new Decimal(100),
          'X-Com-TX memo',
          senderCom.communityUuid!,
          sendUser.gradidoID,
          fullName(sendUser.firstName, sendUser.lastName),
          sendUser.alias,
        )
        // invoke encryption as beeing on the foreignCom side to find in voteForSendCoins the correct homeCom
        const jws = await encryptAndSign(
          payload,
          senderCom.privateJwtKey!,
          recipientCom.publicJwtKey!,
        )
        const args = new EncryptedTransferArgs()
        args.publicKey = senderCom.publicKey.toString('hex')
        args.jwt = jws
        args.handshakeID = 'handshakeID'
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
  emailContact.emailChecked = true
  emailContact.emailOptInTypeId = 1
  emailContact.emailVerificationCode = '1' + userId
  return emailContact
}
