import { getHomeCommunityDrizzle } from 'database'
import { Elysia } from 'elysia'
import { communityInfoWireSchema, signedJsonResponse } from 'shared'
import * as v from 'valibot'
import { statusNumber } from './utils'

export const peerApiRoutesV1 = new Elysia({ prefix: 'v1' })
  // public routes, signed with the home community's Ed25519 key (RFC 9421)
  .get(
    'communityInfos', // TODO: create AppContext and use
    async () => v.parse(communityInfoWireSchema, await getHomeCommunityDrizzle()),
    {
      response: communityInfoWireSchema,
      mapResponse: async ({ responseValue, set }) =>
        signedJsonResponse(
          responseValue,
          statusNumber(set.status),
          // TODO: create AppContext and use
          await getHomeCommunityDrizzle(),
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
