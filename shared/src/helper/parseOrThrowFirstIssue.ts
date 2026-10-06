// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

/**
 * Parses `value` with `schema` and returns the parsed value, or throws an Error carrying the
 * message of the first issue only - the one sentence a client shows, whatever else the
 * schema found.
 */
export const parseOrThrowFirstIssue = <TSchema extends v.GenericSchema>(
  schema: TSchema,
  value: unknown,
): v.InferOutput<TSchema> => {
  const result = v.safeParse(schema, value)
  if (!result.success) {
    throw new Error(result.issues[0].message)
  }
  return result.output
}
