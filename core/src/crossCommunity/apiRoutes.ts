import { getHomeCommunityDrizzle } from 'database'
import { Context, Elysia, ElysiaCustomStatusResponse, StatusMap, status } from 'elysia'
import { FieldOccurrence } from 'http-message-sig'
import { getLogger } from 'log4js'
import {
  AppContext,
  communityInfoWireSchema,
  signatureNonceSchema,
  signHttpMessage,
  uuidv4Schema,
  verifyHttpMessage,
} from 'shared'
import { hashGenericBase64 } from 'shared-native'
import * as v from 'valibot'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'
import { ApiClientCompleted } from './ApiClient'
import { ApiClientCache } from './ApiClientCache'
import { crossGroupTransactionWireSchema, userPublicInfoWireSchema } from './schema'
import {
  auth,
  emailTransactionReceived,
  prepareSendCoins,
  revertSendCoins,
  revertSettledSendCoins,
  settleSendCoins,
} from './transferCoins'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.crossCommunity.apiRoutes`)

export const apiRoutesV1 = new Elysia({ prefix: 'v1' })
  // public routes: the answer is signed with the home community's Ed25519 key (RFC 9421) and carries
  // the exchangeId of the request in its body, bound by the signed digest; the caller compares it
  .get(
    'communityInfos', // TODO: create AppContext and use
    async ({ query: { exchangeId } }) =>
      v.parse(communityInfoWireSchema, { exchangeId, ...(await getHomeCommunityDrizzle()) }),
    {
      query: v.object({ exchangeId: signatureNonceSchema }),
      response: communityInfoWireSchema,
      mapResponse: signedJsonResponse,
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
    let nonce: string | undefined
    try {
      ;({ keyId: senderComPublicKeyHex, nonce } = await verifyHttpMessage(message))
    } catch (error) {
      logger.debug('request without valid signature', error)
      throw status('Unauthorized')
    }
    // signed back with the answer
    if (!nonce) {
      logger.debug(`request without nonce, from community: ${senderComPublicKeyHex}`)
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
      logger.debug(
        `error on decrypt from community:  ${senderComPublicKeyHex}`,
        decryptResult.error,
      )
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
    return { senderClient, nonce }
  })
  // routes for other communities: derive has verified the signature, decrypted the body
  // Routes for Receiving a GDD Transaction from another community
  .guard(
    {
      body: crossGroupTransactionWireSchema,
      senderCommunityUuid: uuidv4Schema,
    },
    (app) =>
      app
        .resolve(auth)
        // the recipient's public info goes back sealed for the sender, as the request came
        .post('prepareSendCoins', prepareSendCoins, {
          mapResponse: signedEncryptedJsonResponse,
          // an error answer is a status with its name as body, unsealed; 404 is auth's answer
          // for a recipient nobody has here
          response: {
            200: userPublicInfoWireSchema,
            404: v.string(),
            500: v.string(),
            503: v.string(),
          },
        })
        .post('revertSendCoins', revertSendCoins, {
          mapResponse: signedJsonResponse,
        })
        .post('settleSendCoins', settleSendCoins, {
          mapResponse: signedJsonResponse,
        })
        .post('revertSettledSendCoins', revertSettledSendCoins, {
          mapResponse: signedJsonResponse,
        })
        .post('emailTransactionReceived', emailTransactionReceived, {
          mapResponse: signedJsonResponse,
        }),
  )

// The part of the Elysia context signedJsonResponse needs, so it can stand in as mapResponse of any
// route: Context has no responseValue, that is only added for this hook.
// nonce: what a signed request brought, see derive; a public route has none to sign back
// Serializes the answer of a route as JSON and signs it with the home community's key. An error
// answer is not signed and carries no data. status() arrives here as it is, not in set.status: a
// Response returned without its code would turn a 404 into a 200.

async function signedEncryptedJsonResponse<T>(
  context: Pick<Context, 'request' | 'set'> & {
    responseValue: T
    nonce?: string
    senderClient: ApiClientCompleted
  },
) {
  return signedJsonResponse(context, true)
}

async function signedJsonResponse<T>(
  {
    responseValue,
    set,
    request,
    nonce,
    senderClient,
  }: Pick<Context, 'request' | 'set'> & {
    responseValue: T
    nonce?: string
    // only a route behind derive has one; a public route answers unencrypted
    senderClient?: ApiClientCompleted
  },
  encrypt?: boolean,
) {
  const isStatus = responseValue instanceof ElysiaCustomStatusResponse
  const status = isStatus ? (responseValue.code as number) : statusNumber(set.status)
  const value: unknown = isStatus ? responseValue.response : responseValue
  if (status >= 400) {
    return new Response(String(value), { status })
  }
  let body: string | BodyInit = JSON.stringify(value)
  let contentHash: string | undefined
  if (encrypt) {
    if (!senderClient) {
      throw new Error('cannot encrypt the answer of a route without a sender client')
    }
    const { box, hash } = AppContext.getInstance()
      .getHomeCommunity()
      .encryptAndHash(body, senderClient.publicEncryptionKey)
    contentHash = hash
    // create view to existing buffer
    body = new Uint8Array(box.buffer as ArrayBuffer, box.byteOffset, box.byteLength)
    set.headers['content-type'] = 'application/octet-stream'
  } else {
    contentHash = hashGenericBase64(body)
    set.headers['content-type'] = 'application/json'
  }
  // Elysia sets it only after mapResponse, and not at all on a returned Response; it is signed here
  set.headers['content-digest'] = `blake2b-256=:${contentHash}:`
  const message = {
    kind: 'response' as const,
    status,
    fields: [
      { name: 'content-digest', value: set.headers['content-digest'] },
      { name: 'content-type', value: set.headers['content-type'] },
    ],
    request,
  }
  const { signature, signatureInput } = await signHttpMessage(message, nonce)
  set.headers.Signature = signature
  set.headers['Signature-Input'] = signatureInput
  return new Response(body, { status })
}

function statusNumber(status?: number | keyof StatusMap): number {
  return typeof status === 'string' ? StatusMap[status] : (status ?? 200)
}

export const apiRoutes = new Elysia({ prefix: 'peer-api' }).use(apiRoutesV1)
