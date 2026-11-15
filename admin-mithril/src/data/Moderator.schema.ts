// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

/** Whom the admin interface is signed in as: the answer to verifyLogin. */
export const moderatorSchema = v.object({
  firstName: v.string(),
  lastName: v.string(),
  alias: v.nullable(v.string()),
  role: v.nullable(v.string()),
  gradidoID: v.string(),
  communityUuid: v.string(),
  language: v.string(),
  avatar: v.nullable(v.string()),
  avatarColorIndex: v.nullable(v.number()),
  visibleCreationGroups: v.array(v.string()),
  seesAllCreationGroups: v.boolean(),
  seesUntagged: v.boolean(),
  // Support-Anfragen K6: an administrator, or a moderator with the tick (supportIsTheirs).
  // ⛔ Optional: a state kept from before K6 carries no such field, and a schema that refused it
  // would throw the whole kept state away, the token with it.
  handlesSupportTickets: v.optional(v.boolean(), false),
})

export type Moderator = v.InferOutput<typeof moderatorSchema>
