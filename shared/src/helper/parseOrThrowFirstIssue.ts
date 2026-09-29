// AI-GENERATED — not an architecture reference
import { z } from 'zod'

/**
 * Parses `value` with `schema` and returns the parsed value, or throws an Error carrying the
 * message of the first issue only - the one sentence a client shows, instead of ZodError's
 * JSON list of all of them.
 */
export const parseOrThrowFirstIssue = <T extends z.ZodTypeAny>(
  schema: T,
  value: unknown,
): z.infer<T> => {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new Error(result.error.issues[0].message)
  }
  return result.data
}
