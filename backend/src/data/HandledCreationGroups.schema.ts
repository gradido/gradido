// AI-GENERATED — not an architecture reference
import { positiveIntegerSchema } from 'shared'
import * as v from 'valibot'

/**
 * "Meine Gruppen" (Admin-Oberfläche MG1), as user_roles.handled_creation_groups holds it: the
 * numbers of the creation groups the holder handles themself, and whether "no group" is among them.
 */
export const handledCreationGroupsSchema = v.object({
  groupIds: v.array(positiveIntegerSchema),
  untagged: v.boolean(),
})

export type HandledCreationGroups = v.InferOutput<typeof handledCreationGroupsSchema>
