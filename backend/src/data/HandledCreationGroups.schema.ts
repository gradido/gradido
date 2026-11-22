// AI-GENERATED — not an architecture reference
import { positiveIntegerSchema } from 'shared'
import * as v from 'valibot'

/**
 * "Meine Gruppen" (Admin-Oberfläche MG1, MG2b), as user_roles.handled_creation_groups and
 * handled_support_groups hold it, one column for each: the numbers of the creation groups the
 * holder handles themself, whether "no group" is among them, and whether an administrator handles
 * nothing of this kind at all (`off`, MG5; who may, decides handledCreationGroupsOf). The ticks stand
 * while it is off, and count again once it is on. A row stored before `off` has none and is on.
 */
export const handledCreationGroupsSchema = v.object({
  groupIds: v.array(positiveIntegerSchema),
  untagged: v.boolean(),
  off: v.optional(v.boolean(), false),
})

export type HandledCreationGroups = v.InferOutput<typeof handledCreationGroupsSchema>
