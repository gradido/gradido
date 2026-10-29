import {
  dbFindUserByIdentifier,
  dbFindUserContact,
  getHomeCommunityDrizzle,
  UserSelect,
} from 'database'
import { LOG4JS_BASE_CATEGORY_NAME } from 'database/src/config/const'
import { Elysia, StatusMap, status } from 'elysia'
import { getLogger } from 'log4js'
import {
  communityInfoWireSchema,
  Result,
  signatureNonceSchema,
  signedJsonResponse,
  Uuidv4,
} from 'shared'
import * as v from 'valibot'
import { sendTransactionReceivedEmail } from '../emails'
import { CrossCommunityError, xcomError } from './errorTypes'
import { crossGroupTransactionSchema, crossGroupTransactionWireSchema, InvolvedParties } from './schema'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.emails.sendEmailTranslated`)

export const apiRoutesV1 = new Elysia({ prefix: 'v1' })
  // public routes, signed with the home community's Ed25519 key (RFC 9421),
  // as the answer to the request that brought the nonce
  .get(
    'communityInfos', // TODO: create AppContext and use
    async () => v.parse(communityInfoWireSchema, await getHomeCommunityDrizzle()),
    {
      query: v.object({ nonce: signatureNonceSchema }),
      response: communityInfoWireSchema,
      mapResponse: async ({ responseValue, set, query, request }) =>
        signedJsonResponse(responseValue, statusNumber(set.status), query.nonce, request),
    },
  )
  .post(
    'emailTransactionReceived',
    async ({ body }) => {
      // change from wire format to runtime format
      const tx = v.parse(crossGroupTransactionSchema, body)
      const userResult = await auth(body)
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
  senderCommunityUuid: Uuidv4, // actual community uuid from sender, verified by signature)
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
