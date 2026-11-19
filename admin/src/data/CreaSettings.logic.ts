// AI-GENERATED — not an architecture reference
import type { FirstCreationSigner } from './CreaSettings.schema'

const SIGNER_REASONS = [
  'NOT_FOUND',
  'DELETED',
  'NOT_MODERATION',
  'SCOPED',
  'IS_MEMBER',
  'NOT_CONFIGURED',
]

/** The words for why somebody cannot sign; null for a code unknown here, shown as it came. */
export const signerReasonKey = (code: string) =>
  SIGNER_REASONS.includes(code) ? `crea.settings.signerReason.${code}` : null

/** The code of a refusal of the server -- `FIRST_CREATION_SIGNER_UNAVAILABLE: <code>` --, or null. */
export const refusedSignerCode = (message: string) =>
  message.match(/FIRST_CREATION_SIGNER_UNAVAILABLE: (\w+)/)?.[1] ?? null

/** The signer by their name, else their alias, else their number. */
export const signerName = ({ firstName, lastName, alias, userId }: FirstCreationSigner) =>
  [firstName, lastName].filter(Boolean).join(' ') || alias || `#${userId}`

/** Who is offered as signer: an administrator or a moderator. The server has the last word. */
export const maySign = (role: string | null) =>
  role === 'ADMIN' || role === 'MODERATOR' || role === 'MODERATOR_AI'

const FAST_MODE_NOTES: Record<string, string> = {
  active: 'crea.settings.fastModeActive',
  // busy now -- something else than "this model cannot"
  rate_limited: 'crea.settings.fastModeBusy',
  refused: 'crea.settings.fastModeRefused',
}

/** What a test of the model adds about the fast mode; null where nothing. */
export const fastModeNoteKey = (fastMode: string) => FAST_MODE_NOTES[fastMode] ?? null
