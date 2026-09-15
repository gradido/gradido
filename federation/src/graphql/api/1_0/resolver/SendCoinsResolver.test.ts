import { cleanDB, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { EncryptedTransferArgs } from 'core'
import {
  AppDatabase,
  Community as DbCommunity,
  PendingTransaction as DbPendingTransaction,
  User as DbUser,
  UserContact as DbUserContact,
  dbSelectForeignMemberAvatarDates,
  foreignMemberAvatarDateKey,
  userAvatarsTable,
} from 'database'
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
    await AppDatabase.getInstance().destroy()
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
          '100',
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
          '100',
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
          '100',
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
          '100',
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
          '100',
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
        '100',
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
          '100',
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
          '100',
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
          '100',
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
        '100',
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
          '100',
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
          '100',
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
          '100',
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
        '100',
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
          '100',
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
          '100',
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
          '100',
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

  describe('the picture date that travels with the transfer', () => {
    const creationDate = new Date()
    const PICTURE_DATE = new Date('2026-09-15T06:00:00.000Z')
    const THIRD_UUID = '56a55482-909e-46a4-bfa2-cd025e894ebe'

    const giveRecipientAPicture = async () => {
      await AppDatabase.getInstance()
        .getDrizzleDataSource()
        .insert(userAvatarsTable)
        .values({
          userId: recipUser.id,
          avatarSmall: Buffer.from([0xff, 0xd8, 0x01]),
          avatarFull: Buffer.from([0xff, 0xd8, 0x02]),
          mimeType: 'image/jpeg',
          updatedAt: PICTURE_DATE,
        })
    }

    // What the authentication handshake sets. The fixture above leaves it null.
    const completeHandshake = async (community: DbCommunity) => {
      await DbCommunity.update({ id: community.id }, { authenticatedAt: new Date() })
    }

    /** A community that exists here, so that a payload may name it as the sender's. */
    const createThirdCommunity = async () => {
      const { publicKey, privateKey } = await createKeyPair()
      const third = DbCommunity.create()
      third.foreign = true
      third.url = 'thirdCom-url'
      third.name = 'thirdCom-Name'
      third.description = 'thirdCom-Description'
      third.creationDate = new Date()
      third.publicKey = Buffer.from(
        '15F92F8EC2EA685D5FD51EE3588F5B4805EBD330EF9EDD16043F3BA9C35C0D93',
        'hex',
      )
      third.publicJwtKey = publicKey
      third.privateJwtKey = privateKey
      third.communityUuid = THIRD_UUID
      // Authenticated as well: if no row appears under this community, it is not for the lack
      // of a handshake.
      third.authenticatedAt = new Date()
      await DbCommunity.insert(third)
    }

    /**
     * The transfer as the sending community builds it. Without `senderAvatarUpdatedAt` the
     * payload carries no such key, like the vote and like a server that does not know the field.
     */
    const transfer = ({
      senderCommunityUuid = senderCom.communityUuid!,
      amount = '100',
      senderAvatarUpdatedAt,
    }: {
      senderCommunityUuid?: string
      amount?: string
      senderAvatarUpdatedAt?: string
    } = {}) =>
      new SendCoinsJwtPayloadType(
        'handshakeID',
        recipientCom.communityUuid!,
        recipUser.gradidoID,
        creationDate.toISOString(),
        amount,
        'X-Com-TX memo',
        senderCommunityUuid,
        sendUser.gradidoID,
        fullName(sendUser.firstName, sendUser.lastName),
        sendUser.alias,
        undefined,
        senderAvatarUpdatedAt,
      )

    /** Always signed by senderCom and encrypted for recipientCom, whatever the payload names. */
    const sealed = async (payload: SendCoinsJwtPayloadType) => {
      const args = new EncryptedTransferArgs()
      args.publicKey = senderCom.publicKey.toString('hex')
      args.jwt = await encryptAndSign(payload, senderCom.privateJwtKey!, recipientCom.publicJwtKey!)
      args.handshakeID = 'handshakeID'
      return args
    }

    const vote = async (payload: SendCoinsJwtPayloadType) =>
      await mutate({
        mutation: voteForSendCoinsMutation,
        variables: { args: await sealed(payload) },
      })

    const settle = async (payload: SendCoinsJwtPayloadType) =>
      await mutate({
        mutation: settleSendCoinsMutation,
        variables: { args: await sealed(payload) },
      })

    const openAnswer = async (response: Awaited<ReturnType<typeof vote>>) => {
      expect(response.errors).toBeUndefined()
      return (await verifyAndDecrypt(
        'handshakeID',
        response.data.voteForSendCoins,
        senderCom.privateJwtKey!,
        recipientCom.publicJwtKey!,
      )) as SendCoinsResponseJwtPayloadType
    }

    /** What the booking list would read for the sender under `communityUuid`. */
    const storedDates = async (communityUuid: string) =>
      await dbSelectForeignMemberAvatarDates([{ communityUuid, gradidoId: sendUser.gradidoID }])

    const pictureDateUnder = (communityUuid: string) =>
      new Map([
        [
          foreignMemberAvatarDateKey({ communityUuid, gradidoId: sendUser.gradidoID }),
          PICTURE_DATE,
        ],
      ])

    const settled = { settleSendCoins: true }

    it("votes with the recipient's picture date when members may see it", async () => {
      await giveRecipientAPicture()

      expect(await openAnswer(await vote(transfer()))).toEqual(
        expect.objectContaining({
          vote: true,
          recipGradidoID: recipUser.gradidoID,
          recipAvatarUpdatedAt: PICTURE_DATE.toISOString(),
        }),
      )
    })

    it('votes with null when the recipient keeps the picture to themselves', async () => {
      await giveRecipientAPicture()
      await DbUser.update({ id: recipUser.id }, { avatarVisibleToMembers: false })

      expect(await openAnswer(await vote(transfer()))).toEqual(
        expect.objectContaining({ vote: true, recipAvatarUpdatedAt: null }),
      )
    })

    it("files the sender's date under the signing community after the settle", async () => {
      await completeHandshake(senderCom)
      await vote(transfer())

      const response = await settle(transfer({ senderAvatarUpdatedAt: PICTURE_DATE.toISOString() }))

      expect(response.data).toEqual(settled)
      expect(await storedDates(senderCom.communityUuid!)).toEqual(
        pictureDateUnder(senderCom.communityUuid!),
      )
    })

    // The envelope is senderCom's; the payload names a third community that exists here, so the
    // vote and the settle go through as they always did.
    it('files it under the community that signed, not the one the payload names', async () => {
      await completeHandshake(senderCom)
      await createThirdCommunity()
      await vote(transfer({ senderCommunityUuid: THIRD_UUID }))

      const response = await settle(
        transfer({
          senderCommunityUuid: THIRD_UUID,
          senderAvatarUpdatedAt: PICTURE_DATE.toISOString(),
        }),
      )

      expect(response.data).toEqual(settled)
      expect(await storedDates(senderCom.communityUuid!)).toEqual(
        pictureDateUnder(senderCom.communityUuid!),
      )
      expect(await storedDates(THIRD_UUID)).toEqual(new Map())
    })

    // ⛔ Two ways for a settle to fail: before the booking (no pending transaction matches the
    // amount) and in the booking itself (settlePendingReceiveTransaction refuses). The second one
    // is what tells writing after the money from writing just before it.
    it('files nothing when the settle itself fails', async () => {
      await completeHandshake(senderCom)
      await vote(transfer())
      const withDate = { senderAvatarUpdatedAt: PICTURE_DATE.toISOString() }

      const otherAmount = await settle(transfer({ ...withDate, amount: '99' }))
      expect(otherAmount.errors?.[0]?.message).toContain(
        "Can't find in settlePendingReceiveTransaction",
      )
      expect(await storedDates(senderCom.communityUuid!)).toEqual(new Map())

      // A second open transfer between the same members: settlePendingReceiveTransaction counts
      // the open pending transactions and rolls back. Its own balance date keeps settleSendCoins'
      // lookup on the first one.
      const open = await DbPendingTransaction.findOneByOrFail({
        userGradidoID: recipUser.gradidoID,
      })
      await DbPendingTransaction.insert(
        DbPendingTransaction.create({
          ...open,
          id: undefined,
          memo: 'a second open transfer',
          balanceDate: new Date(creationDate.getTime() - 60_000),
        }),
      )
      const refusedBooking = await settle(transfer(withDate))
      expect(refusedBooking.errors?.[0]?.message).toBe(
        'X-Com: recipient Transaction was not successful',
      )
      expect(await storedDates(senderCom.communityUuid!)).toEqual(new Map())

      // And the same settle files the date once the booking goes through.
      await DbPendingTransaction.delete({ memo: 'a second open transfer' })
      expect((await settle(transfer(withDate))).data).toEqual(settled)
      expect(await storedDates(senderCom.communityUuid!)).toEqual(
        pictureDateUnder(senderCom.communityUuid!),
      )
    })

    it('files nothing for a signer that has not completed the handshake', async () => {
      await vote(transfer())

      const response = await settle(transfer({ senderAvatarUpdatedAt: PICTURE_DATE.toISOString() }))

      expect(response.data).toEqual(settled)
      expect(await storedDates(senderCom.communityUuid!)).toEqual(new Map())
    })

    it('settles as before when the payload carries no date', async () => {
      await completeHandshake(senderCom)
      await vote(transfer())

      expect((await settle(transfer())).data).toEqual(settled)
      expect(await storedDates(senderCom.communityUuid!)).toEqual(new Map())
    })

    it('settles as before when the payload carries a date that does not parse', async () => {
      await completeHandshake(senderCom)
      await vote(transfer())

      expect((await settle(transfer({ senderAvatarUpdatedAt: 'gestern' }))).data).toEqual(settled)
      expect(await storedDates(senderCom.communityUuid!)).toEqual(new Map())
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
