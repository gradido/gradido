// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

const locationSchema = v.object({ latitude: v.number(), longitude: v.number() })

export type Location = v.InferOutput<typeof locationSchema>

const federatedCommunitySchema = v.object({
  id: v.number(),
  apiVersion: v.string(),
  createdAt: v.nullable(v.string()),
  lastAnnouncedAt: v.nullable(v.string()),
  verifiedAt: v.nullable(v.string()),
  lastErrorAt: v.nullable(v.string()),
})

export type FederatedCommunity = v.InferOutput<typeof federatedCommunitySchema>

/** A community as allCommunities answers it, with the federations it is reached by. */
const communitySchema = v.object({
  foreign: v.boolean(),
  url: v.string(),
  publicKey: v.string(),
  uuid: v.nullable(v.string()),
  authenticatedAt: v.nullable(v.string()),
  name: v.nullable(v.string()),
  description: v.nullable(v.string()),
  gmsApiKey: v.nullable(v.string()),
  location: v.nullable(locationSchema),
  createdAt: v.nullable(v.string()),
  hieroTopicId: v.nullable(v.string()),
  federatedCommunities: v.array(federatedCommunitySchema),
})

export type Community = v.InferOutput<typeof communitySchema>

export const allCommunitiesSchema = v.object({ allCommunities: v.array(communitySchema) })
