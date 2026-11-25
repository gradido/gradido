// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

/** A group contributions are filed under, as every list of them answers (`graphql/creationGroups.ts`). */
export const creationGroupSchema = v.object({
  id: v.number(),
  tag: v.string(),
  name: v.nullable(v.string()),
})

export type CreationGroup = v.InferOutput<typeof creationGroupSchema>
