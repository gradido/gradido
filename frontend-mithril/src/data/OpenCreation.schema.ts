// AI-GENERATED — not an architecture reference
import * as v from 'valibot'
import { gddSchema } from './Gdd.schema'

/** The answer to `graphql/openCreations.ts`: the months from the oldest to the current one. */
export const openCreationsSchema = v.pipe(
  v.object({
    openCreations: v.array(v.object({ year: v.number(), month: v.number(), amount: gddSchema })),
  }),
  v.transform(({ openCreations }) => openCreations),
)
