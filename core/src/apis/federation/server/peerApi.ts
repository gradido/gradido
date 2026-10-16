import { getHomeCommunityDrizzle } from 'database'
import { Elysia } from 'elysia'
import { communityInfoWireSchema } from 'shared'
import * as v from 'valibot'

export const peerApiRoutesV1 = new Elysia({ prefix: 'v1' })
  // public routes
  // TODO: sign
  .get(
    'communityInfos',
    async () => v.parse(communityInfoWireSchema, await getHomeCommunityDrizzle()),
    {
      response: communityInfoWireSchema,
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
