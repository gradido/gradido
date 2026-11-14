// AI-GENERATED — not an architecture reference
import { databaseErrorCode } from 'core'
import { LogError } from '@/server/LogError'

/**
 * Runs a database access of a resolver and lets nothing of what it throws leave: a failed query
 * carries its parameters in its message, and the words a member wrote may be among them. Thrown
 * on, they would be written to the request log and sent back in the answer. What leaves is
 * `code`, and the log gets the driver's code beside it.
 */
export const fromDatabase = async <T>(code: string, work: () => Promise<T>): Promise<T> => {
  try {
    return await work()
  } catch (error) {
    throw new LogError(code, databaseErrorCode(error))
  }
}
