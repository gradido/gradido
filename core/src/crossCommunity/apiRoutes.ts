import {
  dbFindUserByIdentifier,
  dbFindUserContact,
  getHomeCommunityDrizzle,
  UserSelect,
} from 'database'
import { Elysia, StatusMap, status } from 'elysia'
import { FieldOccurrence } from 'http-message-sig'
import { getLogger } from 'log4js'
import {
  AppContext,
  communityInfoWireSchema,
  FEDERATION_REQUEST_TIMEOUT_MS,
  Result,
  signatureNonceSchema,
  signHttpMessage,
  Uuidv4,
  verifyHttpMessage,
} from 'shared'
import { hashGenericBase64 } from 'shared-native'
import * as v from 'valibot'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'
import { sendTransactionReceivedEmail } from '../emails'
import { ApiClientCache } from './ApiClientCache'
import { CrossCommunityError, xcomError } from './errorTypes'
import {
  crossGroupTransactionSchema,
  crossGroupTransactionWireSchema,
  InvolvedParties,
} from './schema'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.crossCommunity.apiRoutes`)

export const apiRoutesV1 = new Elysia({
  prefix: 'v1',
  serve: { idleTimeout: FEDERATION_REQUEST_TIMEOUT_MS },
})
  // public routes: the answer is signed with the home community's Ed25519 key (RFC 9421), with the
  // exchangeId of the request as nonce, and carries that exchangeId in its body too
  .get(
    'communityInfos', // TODO: create AppContext and use
    async ({ query: { exchangeId } }) =>
      v.parse(communityInfoWireSchema, { exchangeId, ...(await getHomeCommunityDrizzle()) }),
    {
      query: v.object({ exchangeId: signatureNonceSchema }),
      response: communityInfoWireSchema,
      mapResponse: async ({ responseValue, set, request }) => {
        const body = JSON.stringify(responseValue)
        // Elysia sets it only after mapResponse, and not at all on a returned Response; it is signed here
        set.headers['content-type'] = 'application/json'
        set.headers['content-digest'] = `blake2b-256=:${hashGenericBase64(body)}:`
        const status = statusNumber(set.status)
        const message = {
          kind: 'response' as const,
          status,
          fields: [
            { name: 'content-digest', value: set.headers['content-digest'] },
            { name: 'content-type', value: set.headers['content-type'] },
          ],
          request,
        }
        const { signature, signatureInput } = await signHttpMessage(message)
        set.headers.Signature = signature
        set.headers['Signature-Input'] = signatureInput
        return new Response(body)
      },
    },
  )
  // every route after this expects its payload signed and encrypted.
  // Only the raw body here: Elysia answers whatever a parse hook throws with 400, a thrown status
  // too, and takes what it returns as the body. The checks sit in derive, where a status counts,
  // and which still runs before the body is validated.
  .onParse(({ request }) => request.arrayBuffer())
  .derive(async (context) => {
    const { request, body } = context
    const message = {
      kind: 'request' as const,
      method: request.method,
      targetUri: request.url,
      fields: [] as FieldOccurrence[],
    }
    request.headers.forEach((value, name) => message.fields.push({ name, value }))
    let senderComPublicKeyHex: string
    try {
      senderComPublicKeyHex = await verifyHttpMessage(message)
    } catch (error) {
      logger.debug('request without valid signature', error)
      throw status('Unauthorized')
    }
    if (request.headers.get('content-type') !== 'application/octet-stream') {
      throw status('Unsupported Media Type')
    }
    const senderClient = await ApiClientCache.getInstance().getByPublicKeyHex(senderComPublicKeyHex)
    if (!senderClient) {
      logger.debug(`api called by unknown community with public key: ${senderComPublicKeyHex}`)
      throw status('Unauthorized')
    }
    const decryptResult = AppContext.getInstance()
      .getHomeCommunity()
      .decryptAndHash(new Uint8Array(body as ArrayBuffer), senderClient.publicEncryptionKey)
    if (!decryptResult.success) {
      logger.debug(`error on decrypt from community:  ${senderComPublicKeyHex}`, decryptResult.error)
      throw status('Bad Request')
    }
    // the signature covers the digest header only, the body is bound by comparing it here
    if (request.headers.get('content-digest') !== `blake2b-256=:${decryptResult.value.hash}:`) {
      logger.debug(`content-digest does not match the body from: ${senderComPublicKeyHex}`)
      throw status('Unauthorized')
    }
    try {
      context.body = JSON.parse(decryptResult.value.payload)
    } catch {
      logger.debug(`body is no JSON, from community: ${senderComPublicKeyHex}`)
      throw status('Bad Request')
    }
    return { senderCommunityUuid: senderClient.communityUuid }
  })
  // routes for other communities: derive has verified the signature, decrypted the body and named
  // the community of the signing key
  .post(
    'emailTransactionReceived',
    async ({ body, senderCommunityUuid }) => {
      // change from wire format to runtime format
      const tx = v.parse(crossGroupTransactionSchema, body)
      const userResult = await auth(tx, senderCommunityUuid)
      if (!userResult.success) {
        logger.debug(userResult.error.message)
        return status(userResult.error.status)
      }
      const user = userResult.value
      if (user.transfersInChat !== false && user.emailId) {
        const userContact = await dbFindUserContact(user.emailId)
        if (!userContact) {
          logger.error(`missing user contact for user ${user.emailId}`)
          return status('Not Found')
        }
        // TODO: add check for pending tx with state settled with this transaction data
        const emailSendResult = await sendTransactionReceivedEmail({
          ...user,
          senderAlias: tx.sender.alias, // change parmater structure in sendTransactionReceivedEmail
          firstName: user.firstName ?? '', // TODO: change to Not NULL
          lastName: user.lastName ?? '', // TODO: change to Not NULL
          email: userContact?.email,
          memo: tx.memo,
          transactionAmount: tx.amount, // change parmater structure in sendTransactionReceivedEmail
        })
        const e = `Transaction Received Email couldn't be sended to user: ${user.id}`
        if (typeof emailSendResult !== 'object') {
          if (logger.isDebugEnabled()) {
            logger.debug(e, JSON.stringify(emailSendResult, null, 2))
          } else {
            logger.warn(e)
          }
        }
      }
      // TODO: extend pending transaction state by email_sended, or finished.. or..  to prevent double send email
      return status('OK')
    },
    {
      body: crossGroupTransactionWireSchema,
    },
  )

function statusNumber(status?: number | keyof StatusMap): number {
  return typeof status === 'string' ? StatusMap[status] : (status ?? 200)
}
// check if tx came from correct community and if recipient user exist and if, return it
async function auth(
  parties: InvolvedParties,
  senderCommunityUuid: Uuidv4, // the community of the key that signed the request
): Promise<Result<UserSelect, CrossCommunityError>> {
  const { sender, recipient } = parties
  // first, check if we are in fact the correct recipient community
  const homeCom = await getHomeCommunityDrizzle()
  if (homeCom.communityUuid !== recipient.communityUuid) {
    const e = `We got a cross transaction for another community: ${recipient.communityUuid}`
    return xcomError('Unauthorized', e)
  }
  // and the sender is the correct sender community
  if (senderCommunityUuid !== sender.communityUuid) {
    const e = `We got a cross transaction from a wrong community: expected: ${sender.communityUuid}, actual: ${senderCommunityUuid}`
    return xcomError('Unauthorized', e)
  }

  // second check if receiver user exists in this community
  const recipientUser = await dbFindUserByIdentifier(recipient.identifier, recipient.communityUuid)
  if (!recipientUser) {
    const e = `User with identifier ${recipient.identifier} not found`
    return xcomError('Not Found', e)
  }
  return { success: true, value: recipientUser }
}

export const apiRoutes = new Elysia({ prefix: 'peer-api' }).use(apiRoutesV1)
