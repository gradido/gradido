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

/**
 * "Meine Gruppen" (MG1): the creation groups the moderator handles themself, by number, and whether
 * "no group" is among them -- one column of the page, "Schöpfung" or "Support" (MG2b). Both empty
 * where none is chosen, or none counts (an assigned scope). `off` (MG5): they handle none of the
 * kind at all, and the ticks stand behind it; a state kept from before has none.
 */
export const handledCreationGroupsSchema = v.object({
  groupIds: v.array(v.number()),
  untagged: v.boolean(),
  off: v.optional(v.boolean(), false),
})

export type HandledCreationGroups = v.InferOutput<typeof handledCreationGroupsSchema>

/** The choice as the admin keeps it between pages: with the moderator it is the choice of. */
export const keptHandledCreationGroupsSchema = v.object({
  of: v.string(),
  ...handledCreationGroupsSchema.entries,
})

export type KeptHandledCreationGroups = v.InferOutput<typeof keptHandledCreationGroupsSchema>

/**
 * The field of the kept state (admin.store.ts): none where a state kept from before has no such
 * field, and none where it cannot be read -- a schema that refused it would throw the whole kept
 * state away, the token with it.
 */
export const keptHandledCreationGroupsField = v.fallback(
  v.nullable(keptHandledCreationGroupsSchema),
  null,
)

/** A group with its number, as the choice names it. */
export const numberedCreationGroupSchema = v.object({
  ...creationGroupNameSchema.entries,
  id: v.number(),
})

export type NumberedCreationGroup = v.InferOutput<typeof numberedCreationGroupSchema>

/** The answer of creationGroupsAndHandled: the groups and the column "Schöpfung". */
export const creationGroupsAndHandledSchema = v.object({
  creationGroups: v.array(numberedCreationGroupSchema),
  handledCreationGroups: handledCreationGroupsSchema,
})

/** The answer of creationGroupsAndHandledSupport (MG2b): the groups and the column "Support". */
export const creationGroupsAndHandledSupportSchema = v.object({
  creationGroups: v.array(numberedCreationGroupSchema),
  handledSupportGroups: handledCreationGroupsSchema,
})

/** The answer of myGroupsChoice (MG2b): the groups and both columns. */
export const myGroupsChoiceSchema = v.object({
  ...creationGroupsAndHandledSchema.entries,
  handledSupportGroups: handledCreationGroupsSchema,
})

/** Both columns, as setHandledGroups answers them (MG2b). */
export const handledGroupsSchema = v.object({
  creation: handledCreationGroupsSchema,
  support: handledCreationGroupsSchema,
})

/** How many contributions still name a group with a hashtag: exactly, and with a space after #. */
export const hashtagCountsSchema = v.object({ exact: v.number(), loose: v.number() })

export type HashtagCounts = v.InferOutput<typeof hashtagCountsSchema>
