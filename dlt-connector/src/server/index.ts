import { TypeBoxFromValibot } from '@sinclair/typemap'
import { Elysia, status, t, ValidationError } from 'elysia'
import { AddressType_NONE } from 'gradido-blockchain-js'
import { getLogger } from 'log4js'
import * as v from 'valibot'
import { ensureCommunitiesAvailable } from '../client/GradidoNode/communities'
import { GradidoNodeClient } from '../client/GradidoNode/GradidoNodeClient'
import { LOG4JS_BASE_CATEGORY } from '../config/const'
import { KeyPairIdentifierLogic } from '../data/KeyPairIdentifier.logic'
import { ResolveKeyPair } from '../interactions/resolveKeyPair/ResolveKeyPair.context'
import { SendToHieroContext } from '../interactions/sendToHiero/SendToHiero.context'
import { IdentifierAccountInput, identifierAccountSchema } from '../schemas/account.schema'
import { transactionSchema } from '../schemas/transaction.schema'
import { hieroTransactionIdStringSchema } from '../schemas/typeGuard.schema'
import {
  accountIdentifierSeedTypeBoxSchema,
  accountIdentifierUserTypeBoxSchema,
} from './input.schema'
import { existTypeBoxSchema } from './output.schema'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.server`)

/**
 * To define a route in Elysia:
 *
 * 1. Choose the HTTP method: get, post, patch, put, or delete.
 *
 * 2. Define the route path:
 *    - **Params**: values inside the path.
 *      Example: path: `/isCommunityExist/:communityTopicId`
 *      → called with: GET `/isCommunityExist/0.0.21732`
 *
 *    - **Query**: values in the query string.
 *      Example: path: `/isCommunityExist`
 *      → called with: GET `/isCommunityExist?communityTopicId=0.0.21732`
 *
 * 3. Write the route handler:
 *    Return a JSON object — often by calling your business logic.
 *
 * 4. Define validation schemas using TypeBoxFromValibot:
 *    - `params` (for path parameters)
 *    - `query` (for query strings)
 *    - `body` (for POST/PUT/PATCH requests)
 *    - `response` (for output)
 *
 * Example:
 * .get(
 *   '/isCommunityExist/:communityTopicId',
 *   async ({ params: { communityTopicId } }) => ({
 *     exists: await isCommunityExist({ communityTopicId })
 *   }),
 *   {
 *     params: t.Object({ communityTopicId: TypeBoxFromValibot(hieroIdSchema) }),
 *     response: t.Object({ exists: t.Boolean() }),
 *   },
 * )
 *
 * 🔗 More info: https://elysiajs.com/at-glance.html
 */
export const appRoutes = new Elysia()
  .onError(({ code, error }) => {
    if (code === 'VALIDATION' && error instanceof ValidationError) {
      logger.debug(JSON.stringify(error.all[0], null, 2))
      logger.error(error.all[0].summary)
      return error.all[0].summary
    }
    return error
  })
  // check if account exists by user, call example:
  // GET /isAccountExist/by-user/0.0.21732/408780b2-59b3-402a-94be-56a4f4f4e8ec/0
  .get(
    '/isAccountExist/by-user/:communityId/:communityTopicId/:userUuid/:accountNr',
    async ({ params: { communityId, communityTopicId, userUuid, accountNr } }) => ({
      exists: await isAccountExist({
        communityId,
        communityTopicId,
        account: { userUuid, accountNr },
      }),
    }),
    {
      params: accountIdentifierUserTypeBoxSchema,
      response: existTypeBoxSchema,
    },
  )
  // check if account exists by seed, call example:
  // GET /isAccountExist/by-seed/0.0.21732/0c4676adfd96519a0551596c
  .get(
    '/isAccountExist/by-seed/:communityId/:communityTopicId/:seed',
    async ({ params: { communityId, communityTopicId, seed } }) => ({
      exists: await isAccountExist({
        communityId,
        communityTopicId,
        seed,
      }),
    }),
    {
      params: accountIdentifierSeedTypeBoxSchema,
      response: existTypeBoxSchema,
    },
  )
  // send transaction to hiero, call example for send transaction:
  // POST /sendTransaction
  // body: {
  //   user: {
  //     communityTopicId: '0.0.21732',
  //     account: {
  //       userUuid: '408780b2-59b3-402a-94be-56a4f4f4e8ec',
  //       accountNr: 0,
  //     },
  //   },
  //   linkedUser: {
  //     communityTopicId: '0.0.21732',
  //     account: {
  //       userUuid: '10689787-00fe-4295-a996-05c0952558d9',
  //       accountNr: 0,
  //     },
  //   },
  //   amount: 10,
  //   memo: 'test',
  //   type: 'TRANSFER',
  //   createdAt: '2022-01-01T00:00:00.000Z',
  // }
  .post(
    '/sendTransaction',
    async ({ body }) => ({
      transactionId: await SendToHieroContext(body),
    }),
    {
      body: TypeBoxFromValibot(transactionSchema),
      response: t.Object({ transactionId: TypeBoxFromValibot(hieroTransactionIdStringSchema) }),
    },
  )

// function stay here for now because it is small and simple, but maybe later if more functions are added, move it to a separate file
async function isAccountExist(identifierAccount: IdentifierAccountInput): Promise<boolean> {
  // check and prepare input
  const startTime = Date.now()
  const identifierAccountParsed = v.parse(identifierAccountSchema, identifierAccount)
  // make sure gradido node knows community
  await ensureCommunitiesAvailable([identifierAccountParsed.communityTopicId])
  const accountKeyPair = await ResolveKeyPair(new KeyPairIdentifierLogic(identifierAccountParsed))
  const publicKey = accountKeyPair.getPublicKey()
  if (!publicKey) {
    throw status(404, { message: "couldn't calculate account key pair" })
  }

  // ask gradido node server for account type, if type !== NONE account exist
  const addressType = await GradidoNodeClient.getInstance().getAddressType(
    publicKey.convertToHex(),
    identifierAccountParsed.communityId,
  )
  const exists = addressType !== AddressType_NONE
  const endTime = Date.now()
  logger.info(`isAccountExist: ${exists}, time used: ${endTime - startTime}ms`)
  if (logger.isDebugEnabled()) {
    logger.debug('params', identifierAccountParsed)
  }
  return exists
}
export type DltRoutes = typeof appRoutes
