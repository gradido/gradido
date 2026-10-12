// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

/**
 * What counts as a position: two numbers on the globe.
 *
 * Numbers, not truthiness: zero is a coordinate like any other -- the prime meridian runs
 * through the UK, France, Spain, Algeria and Ghana, and the equator through Ecuador, Kenya
 * and Indonesia. `v.number()` refuses NaN and text, the range refuses the rest: a latitude
 * of 999 is not a place either; it is the kind of value a broken client sends, and the map
 * would draw it somewhere absurd.
 */
export const locationSchema = v.object({
  latitude: v.pipe(v.number(), v.minValue(-90), v.maxValue(90)),
  longitude: v.pipe(v.number(), v.minValue(-180), v.maxValue(180)),
})

export type Location = v.InferOutput<typeof locationSchema>

/**
 * The one rule for both ends -- what is written to the column and what is read back from
 * it -- so the two cannot drift.
 */
export const isUsableLocation = (location: unknown): boolean => v.is(locationSchema, location)
