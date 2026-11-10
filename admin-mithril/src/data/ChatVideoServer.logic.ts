// AI-GENERATED — not an architecture reference
import type { ServerValues } from './ChatVideoServer.schema'

const CHECK_REASONS = ['UNREACHABLE', 'NOT_JITSI', 'LOGIN_REQUIRED', 'NO_ANONYMOUS', 'NO_BOSH']
const INVALID_REASONS = ['NOT_HTTPS', 'NOT_A_BASE_ADDRESS', 'BAD_PREFIX', 'TOO_LONG']

/** The words for why a server did not answer; null for a code unknown here, shown as it came. */
export const checkReasonKey = (reason: string) =>
  CHECK_REASONS.includes(reason) ? `chatAdmin.reason.${reason}` : null

/**
 * The words for a refusal of the server, with what they take; null where it named nothing known,
 * and its message is shown as it came.
 */
export const refusalWords = (message: string): [string, Record<string, string>?] | null => {
  const invalid = message.match(/CHAT_VIDEO_SERVER_INVALID: ([A-Z_]+)/)?.[1]
  if (invalid) {
    return INVALID_REASONS.includes(invalid)
      ? [`chatAdmin.errors.invalid.${invalid}`]
      : ['chatAdmin.errors.invalid.other', { reason: invalid }]
  }
  if (message.includes('CHAT_VIDEO_SERVER_DUPLICATE')) {
    return ['chatAdmin.errors.duplicate']
  }
  if (message.includes('CHAT_VIDEO_SERVER_NOT_FOUND')) {
    return ['chatAdmin.errors.notFound']
  }
  return null
}

/** The fields as the server takes them: trimmed, empty is none. */
export const serverInput = ({ baseUrl, operator, roomPrefix, note }: ServerValues) => ({
  baseUrl: baseUrl.trim(),
  operator: operator.trim() || null,
  roomPrefix: roomPrefix.trim() || null,
  note: note.trim() || null,
})
