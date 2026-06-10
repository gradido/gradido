import { TypeBoxFromValibot } from '@sinclair/typemap'
import { Elysia, status, t, ValidationError } from 'elysia'
import {
  CompleteTransaction,
  GRD_SUCCESS,
  GRDT_ADDRESS_NONE,
  gradidoCoreResultToString,
  MonotonicTimer,
} from 'gradido-blockchain-js'
import { getLogger } from 'log4js'
import * as v from 'valibot'
import { ensureCommunitiesAvailable } from '../client/GradidoNode/communities'
import { GradidoNodeClient } from '../client/GradidoNode/GradidoNodeClient'
import { LOG4JS_BASE_CATEGORY } from '../config/const'
import { KeyPairIdentifierLogic } from '../data/KeyPairIdentifier.logic'
import { TransactionType } from '../data/TransactionType.enum'
import { ResolveKeyPair } from '../interactions/resolveKeyPair/ResolveKeyPair.context'
import { SendToHieroContext } from '../interactions/sendToHiero/SendToHiero.context'
import { IdentifierAccountInput, identifierAccountSchema } from '../schemas/account.schema'
import { transactionSchema } from '../schemas/transaction.schema'
import { hieroTransactionIdStringSchema, Uuidv4, uuidv4Schema } from '../schemas/typeGuard.schema'
import {
  accountIdentifierSeedTypeBoxSchema,
  accountIdentifierUserTypeBoxSchema,
} from './input.schema'
import {
  CheckedTransactionInput,
  checkedTransactionSchema,
  existTypeBoxSchema,
  TransactionPartyInput,
} from './output.schema'

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
  .post(
    '/validateAndDecodeConfirmedTransaction',
    async ({ body }) => {
      console.log(body)
      const result = v.parse(
        checkedTransactionSchema,
        await validateAndDecodeConfirmedTransaction(
          body.transactionBase64,
          v.parse(uuidv4Schema, body.communityUuid),
        ),
      )
      return result
    },
    {
      body: t.Object({
        transactionBase64: t.String(),
        communityUuid: TypeBoxFromValibot(uuidv4Schema),
      }),
      response: TypeBoxFromValibot(checkedTransactionSchema),
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
  const exists = addressType !== GRDT_ADDRESS_NONE
  const endTime = Date.now()
  logger.info(`isAccountExist: ${exists}, time used: ${endTime - startTime}ms`)
  if (logger.isDebugEnabled()) {
    logger.debug('params', identifierAccountParsed)
  }
  return exists
}

async function validateAndDecodeConfirmedTransaction(
  transactionBase64: string,
  communityUuid: Uuidv4,
): Promise<CheckedTransactionInput> {
  try {
    const timeUsed = new MonotonicTimer()
    const serializedTransaction = Buffer.from(transactionBase64, 'base64')
    const tx = new CompleteTransaction()
    let result = tx.initFromProtobuf(
      serializedTransaction,
      Buffer.from(communityUuid.replaceAll('-', ''), 'hex'),
    )
    if (GRD_SUCCESS !== result) {
      return { valid: false, error: gradidoCoreResultToString(result) }
    }
    result = tx.validate(true)
    if (GRD_SUCCESS !== result) {
      return { valid: false, error: gradidoCoreResultToString(result) }
    }
    let sender: TransactionPartyInput | null = null
    const senderPublicKey = tx.getSenderPublicKey()
    const registeredAccount = tx.getRegisteredAccount()
    if (senderPublicKey) {
      const accountBalance = tx.getAccountBalance(senderPublicKey)
      sender = {
        publicKey: senderPublicKey.toString('hex'),
        communityUuid: tx.getSenderCommunityUuidString(),
        finalBalance: accountBalance.getBalance().toString(4),
      }
    } else if (registeredAccount) {
      sender = {
        publicKey: registeredAccount.toString('hex'),
        communityUuid: tx.getSenderCommunityUuidString(),
        finalBalance: '0',
      }
    }
    let recipient: TransactionPartyInput | null = null
    const recipientPublicKey = tx.getRecipientPublicKey()
    if (recipientPublicKey) {
      const accountBalance = tx.getAccountBalance(recipientPublicKey)
      recipient = {
        publicKey: recipientPublicKey.toString('hex'),
        communityUuid: tx.getRecipientCommunityUuidString(),
        finalBalance: accountBalance.getBalance().toString(4),
      }
    }
    // GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER
    // On redeem deferred transfer, sender is the virtual account created with transactionLink.code as seed
    // but legacy backend expect for sender, the original sender, so we use the third account balance entries on redeem deferred transfer,
    // which carry the final balance, after the change was returned, exact the sender, the legacy backend expected
    if (tx.getTransactionType() === 7 && sender && recipient) {
      const accountBalances = tx.getAccountBalances()
      for (let i = 0; i <= accountBalances.size(); i++) {
        const accountBalance = accountBalances.get(i)
        const publicKeyHex = accountBalance.getPublicKey()!.convertToHex()
        if (publicKeyHex !== sender.publicKey && publicKeyHex !== recipient.publicKey) {
          sender.finalBalance = accountBalance.getBalance().toString(4)
          sender.publicKey = publicKeyHex
          break
        }
      }
    }
    const checkedTransaction: CheckedTransactionInput = {
      valid: true,
      amount: tx.getAmount()?.toString(4) || null,
      createdAt: tx.getCreatedAt()?.toString() || null,
      confirmedAt: tx.getConfirmedAt()?.toString() || null,
      hieroTransactionId: tx.getLedgerAnchor().getHieroTransactionId().toString() || null,
      recipient,
      sender,
      transactionType: tx.getTransactionType(),
    }
    logger.info(`validateAndDecodeConfirmedTransaction: ${timeUsed.string()}`)
    return checkedTransaction
  } catch (e) {
    logger.error(`validateAndDecodeConfirmedTransaction failed: ${e}`)
    return { valid: false, error: e instanceof Error ? e.message : 'unknown error' }
  }
}
export type DltRoutes = typeof appRoutes
