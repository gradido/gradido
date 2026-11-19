// AI-GENERATED — not an architecture reference
import type { ChatMessage } from './AiChat.schema'

/**
 * The one message the interface sends rather than the moderator: it opens a conversation, and
 * Crea answers with her greeting. Never shown.
 */
export const BOOTSTRAP_COMMAND = '/start'

const SIGNATURE = '[SIGNATUR]'

const ERROR_KEYS: Record<string, string> = {
  api_inactive: 'ai.error-api-inactive',
  thread_not_found: 'ai.error-thread-not-found',
  output_too_long: 'ai.error-output-too-long',
  send_failed: 'ai.error-send-failed',
}

/** The words for an error code of the server; a code unknown here gets a sentence all the same. */
export const chatErrorKey = (code: string) => ERROR_KEYS[code] ?? 'ai.error-unknown'

/**
 * Crea's words with the moderator's signature in place of hers, as shown and as copied. Only
 * hers: what the moderator pasted is somebody else's.
 */
export const withSignature = ({ content, role }: ChatMessage, signature: string) =>
  signature && role === 'assistant' ? content.split(SIGNATURE).join(signature) : content

/** Whether Crea left a place for a signature there is none for. */
export const signatureMissing = (messages: ChatMessage[], signature: string) =>
  !signature &&
  messages.some(({ role, content }) => role === 'assistant' && content.includes(SIGNATURE))

/**
 * A stored conversation as the chat takes it up: its id -- none where its first message is an
 * error, so the next message starts a fresh one -- and its messages without the opening word.
 */
export const resumed = (messages: ChatMessage[]) => ({
  threadId: messages[0]?.threadId ?? '',
  messages: messages.filter(({ content }) => content !== BOOTSTRAP_COMMAND),
})
