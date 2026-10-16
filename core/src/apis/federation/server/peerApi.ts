import { getHomeCommunityDrizzle } from 'database'
import { Elysia } from 'elysia'
import { communityInfoWireSchema, signatureNonceSchema, signedJsonResponse } from 'shared'
import * as v from 'valibot'
import { statusNumber } from './utils'

export const peerApiRoutesV1 = new Elysia({ prefix: 'v1' })
  // public routes, signed with the home community's Ed25519 key (RFC 9421),
  // as the answer to the request that brought the nonce
  .get(
    'communityInfos', // TODO: create AppContext and use
    async () => v.parse(communityInfoWireSchema, await getHomeCommunityDrizzle()),
    {
      query: v.object({ nonce: signatureNonceSchema }),
      response: communityInfoWireSchema,
      mapResponse: async ({ responseValue, set, query }) =>
        signedJsonResponse(
          responseValue,
          statusNumber(set.status),
          // TODO: create AppContext and use
          await getHomeCommunityDrizzle(),
          query.nonce,
        ),
    },
  )
  // encrypted and signed routes
  .post('handshake1Open', async ({ body: { handshakeId } }) => true, {
    body: v.object({
      handshakeId: v.number(),
    }),
    response: v.boolean(),
  })

export const peerApiRoutes = new Elysia({ prefix: 'peer-api' }).use(peerApiRoutesV1)
