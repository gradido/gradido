// AI-GENERATED — not an architecture reference
import { locationSchema, uuidv4Schema } from 'shared/browser'
import * as v from 'valibot'

/** The member signed in, as `login` and `verifyLogin` answer. */
export const memberSchema = v.object({
  gradidoID: uuidv4Schema,
  communityUuid: v.string(),
  alias: v.nullable(v.string()),
  firstName: v.nullable(v.string()),
  lastName: v.nullable(v.string()),
  language: v.string(),
  role: v.nullable(v.string()),
  createdAt: v.string(),
  emailChecked: v.boolean(),
  emailContact: v.nullable(v.object({ email: v.string() })),
  klickTipp: v.nullable(v.object({ newsletterState: v.boolean() })),
  avatar: v.nullable(v.string()),
  avatarVisibleToMembers: v.nullable(v.boolean()),
  creationAllowed: v.boolean(),
  firstCreationStatus: v.nullable(v.string()),
  transfersInChat: v.nullable(v.boolean()),
  gmsAllowed: v.nullable(v.boolean()),
  gmsPublishLocation: v.nullable(v.string()),
  humhubAllowed: v.nullable(v.boolean()),
  userLocation: v.nullable(locationSchema),
  // never chosen is not hidden, as in the old wallet
  hideAmountGDD: v.nullable(v.boolean(), false),
  hideAmountGDT: v.nullable(v.boolean(), false),
})

export type Member = v.InferOutput<typeof memberSchema>
