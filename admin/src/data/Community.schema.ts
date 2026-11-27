// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

const locationSchema = v.object({ latitude: v.number(), longitude: v.number() })

export type Location = v.InferOutput<typeof locationSchema>

/** A community as allCommunities answers it. */
const communitySchema = v.object({
  foreign: v.boolean(),
  url: v.string(),
  publicKey: v.string(),
  uuid: v.nullable(v.string()),
  authenticatedAt: v.nullable(v.string()),
  // the last time a foreign community answered its community infos correctly
  verifiedAt: v.nullable(v.string()),
  name: v.nullable(v.string()),
  description: v.nullable(v.string()),
  gmsApiKey: v.nullable(v.string()),
  location: v.nullable(locationSchema),
  createdAt: v.nullable(v.string()),
  hieroTopicId: v.nullable(v.string()),
})

export type Community = v.InferOutput<typeof communitySchema>

/** A page of the communities, and how many there are in all. */
export const allCommunitiesSchema = v.object({
  allCommunities: v.object({ count: v.number(), communities: v.array(communitySchema) }),
})
