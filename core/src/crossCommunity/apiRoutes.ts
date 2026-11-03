import { getHomeCommunityDrizzle } from 'database'
import { Elysia } from 'elysia'
import { communityInfoWireSchema, signatureNonceSchema, signedJsonResponse } from 'shared'
import * as v from 'valibot'
import {
  crossGroupTransactionForeignUserInfo,
  crossGroupTransactionSchema,
  crossGroupTransactionWireSchema,
} from './schema'
import { prepareSendCoins } from './transferCoins'
import { statusNumber } from './utils'

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
    'prepareSendCoins',
    async ({ body }) => await prepareSendCoins(v.parse(crossGroupTransactionSchema, body)),
    {
      // beforeHandle: (), decrypt and check signature first
      body: crossGroupTransactionWireSchema,
      /*
    mapResponse: async ({ responseValue, set, query, request }) =>
      signedJsonResponse(responseValue, statusNumber(set.status), query.nonce, request),
      */
      response: crossGroupTransactionForeignUserInfo,
    },
  )
  .post('revertSendCoins', async () => false)
  .post('revertSettledSendCoins', async () => false)
  .post('settleSendCoins', async () => false)

export const apiRoutes = new Elysia({ prefix: 'peer-api' }).use(apiRoutesV1)
