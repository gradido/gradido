import { TypeBoxFromValibot } from '@sinclair/typemap'
import { Type } from '@sinclair/typebox'
import { Elysia, status } from 'elysia'
import { AddressType_NONE } from 'gradido-blockchain-js'
import { getLogger } from 'log4js'
import { parse } from 'valibot'
import { GradidoNodeClient } from '../client/GradidoNode/GradidoNodeClient'
import { LOG4JS_BASE_CATEGORY } from '../config/const'
import { KeyPairIdentifierLogic } from '../data/KeyPairIdentifier.logic'
import { KeyPairCalculation } from '../interactions/keyPairCalculation/KeyPairCalculation.context'
import { SendToHieroContext } from '../interactions/sendToHiero/SendToHiero.context'
import { IdentifierAccount, identifierAccountSchema } from '../schemas/account.schema'
import { transactionSchema } from '../schemas/transaction.schema'
import { hieroTransactionIdSchema } from '../schemas/typeGuard.schema'
import {
  accountIdentifierSeedSchema,
  accountIdentifierUserSchema,
  existSchema,
} from './input.schema'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.server`)

export const appRoutes = new Elysia()
  .get(
    '/isAccountExist/by-user/:communityTopicId/:userUuid/:accountNr',
    async ({ params: { communityTopicId, userUuid, accountNr } }) => {
      const accountIdentifier = parse(identifierAccountSchema, {
        communityTopicId,
        account: { userUuid, accountNr },
      })
      return { exists: await isAccountExist(accountIdentifier) }
    },
    // validation schemas
    { params: accountIdentifierUserSchema, response: existSchema },
  )
  .get(
    '/isAccountExist/by-seed/:communityTopicId/:seed',
    async ({ params: { communityTopicId, seed } }) => {
      const accountIdentifier = parse(identifierAccountSchema, {
        communityTopicId,
        seed: { seed },
      })
      return { exists: await isAccountExist(accountIdentifier) }
    },
    // validation schemas
    { params: accountIdentifierSeedSchema, response: existSchema },
  )
  .post(
    '/sendTransaction',
    async ({ body }) => {
      console.log("sendTransaction was called")
      return "0.0.123"
      console.log(body)
      console.log(parse(transactionSchema, body))
      const transaction = parse(transactionSchema, body)
      return await SendToHieroContext(transaction)
    },
    // validation schemas
    {
      // body: TypeBoxFromValibot(transactionSchema),
      body: Type.Object({
        user: Type.Object({
          communityUser: Type.Object({
            uuid: Type.String({ format: 'uuid' }),
            accountNr: Type.Optional(Type.String()), // optional/undefined
          }),
          communityUuid: Type.String({ format: 'uuid' }),
        }),
        createdAt: Type.String({ format: 'date-time' }),
        accountType: Type.Literal('COMMUNITY_HUMAN'),
        type: Type.Literal('REGISTER_ADDRESS'),
      })
      // response: TypeBoxFromValibot(hieroTransactionIdSchema),
    },
  )

async function isAccountExist(identifierAccount: IdentifierAccount): Promise<boolean> {
  const startTime = Date.now()
  const accountKeyPair = await KeyPairCalculation(new KeyPairIdentifierLogic(identifierAccount))
  const publicKey = accountKeyPair.getPublicKey()
  if (!publicKey) {
    throw status(404, "couldn't calculate account key pair")
  }

  // ask gradido node server for account type, if type !== NONE account exist
  const addressType = await GradidoNodeClient.getInstance().getAddressType(
    publicKey.convertToHex(),
    identifierAccount.communityTopicId,
  )
  const endTime = Date.now()
  logger.info(
    `isAccountExist: ${addressType !== AddressType_NONE}, time used: ${endTime - startTime}ms`,
  )
  if (logger.isDebugEnabled()) {
    logger.debug('params', identifierAccount)
  }
  return addressType !== AddressType_NONE
}
export type DltRoutes = typeof appRoutes