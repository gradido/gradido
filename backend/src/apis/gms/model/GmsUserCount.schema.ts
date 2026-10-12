// AI-GENERATED — not an architecture reference
import { nonNegativeIntegerSchema } from 'shared'
import * as v from 'valibot'

/**
 * What the GMS answers on `GET /user-count` (gradido/gms_workspace#43): how many members
 * stand on the map, across every community it holds.
 */
export const gmsUserCountSchema = v.object({
  count: nonNegativeIntegerSchema,
})

export type GmsUserCount = v.InferOutput<typeof gmsUserCountSchema>
