// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

/** A creation group as every list names it: its tag, and its name where it has one. */
export const creationGroupNameSchema = v.object({ tag: v.string(), name: v.nullable(v.string()) })

/** A creation group as the page that manages them reads it, with where its old hashtags stand. */
export const creationGroupSchema = v.object({
  ...creationGroupNameSchema.entries,
  id: v.number(),
  // when its old hashtags were looked at; null where never
  hashtagsAdoptedAt: v.nullable(v.string()),
  hashtagsAdoptedCount: v.nullable(v.number()),
})

export type CreationGroup = v.InferOutput<typeof creationGroupSchema>

/** How many contributions still name a group with a hashtag: exactly, and with a space after #. */
export const hashtagCountsSchema = v.object({ exact: v.number(), loose: v.number() })

export type HashtagCounts = v.InferOutput<typeof hashtagCountsSchema>
