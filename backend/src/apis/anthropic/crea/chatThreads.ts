// AI-GENERATED — not an architecture reference
import {
  type CreachatThreadSelect,
  dbDeleteCreachatThreadByIdAndUserId,
  dbDeleteCreachatThreadsUnusedSince,
  dbInsertCreachatThread,
  dbSelectCreachatThreadByIdAndUserId,
  dbSelectNewestLiveCreachatThread,
  dbUpdateCreachatThreadMessages,
} from 'database'
import { getLogger } from 'log4js'
import { Duration } from 'shared'
import { v4 as uuidv4 } from 'uuid'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

// CreaChat's view of a stored thread. The database layer answers which rows exist; the
// rules about what they mean — how long a chat may lie idle, how much of it travels to
// the API, how the transcript is encoded — live here, because they are rules about Crea.

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.anthropic.crea.chatThreads`)

/**
 * A thread untouched for this long is thrown away, so opening the chat after a break
 * starts a fresh one.
 *
 * Short on purpose. A moderator works a handful of contributions in one sitting, and the
 * next sitting is usually a different participant — carrying the old pile along makes
 * Crea blend cases she should be judging one at a time, and the moderator cannot see that
 * happening. Starting over is the visible failure of the two: an empty window is noticed
 * at once, and nothing is lost, because the contribution text sits in the list beside the
 * chat. Four hours survives a lunch break, a call and a long meeting, and never survives
 * a night.
 *
 * It doubles as the retention rule: pasted participant text is gone within hours rather
 * than lying around for weeks.
 */
const THREAD_IDLE_HOURS = 4

/**
 * How many turns travel to the API. Everything stays stored — the moderator keeps his
 * full window — but a very long chat would otherwise resend more and more context on
 * every message. A backstop rather than a working limit: 60 turns are roughly 30
 * exchanges, far more than one sitting produces before the idle window above ends it.
 */
const MAX_HISTORY_TURNS = 60

/**
 * The same cap measured in characters, because turns are not all the same size. Crea's
 * chat rules invite the moderator to paste several contributions at once, so 60 turns
 * can be a handful of lines or far more than any model will take. Without this a long
 * thread wedges for good: the request exceeds the context window, the call fails, and
 * every retry sends the same stored history again. Roughly 50k tokens, well inside every
 * model the admin can pick.
 */
const MAX_HISTORY_CHARS = 200_000

export interface CreaChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface CreaChatThreadState {
  id: string
  turns: CreaChatTurn[]
}

function idleCutoff(): Date {
  return Duration.hours(THREAD_IDLE_HOURS).subtractFromDate(new Date())
}

/**
 * Reads the stored transcript. Undefined when the row holds something that is not a
 * usable transcript — the caller decides what that means, and the two callers want
 * opposite things: reading may start empty, writing must not, or the append would
 * replace an unreadable conversation with a two-turn one and lose it for good.
 */
function parseTurns(thread: CreachatThreadSelect): CreaChatTurn[] | undefined {
  try {
    const parsed: unknown = JSON.parse(thread.messages)
    if (!Array.isArray(parsed)) {
      throw new TypeError('stored transcript is not an array')
    }
    return parsed as CreaChatTurn[]
  } catch (error) {
    logger.error(`unreadable transcript in creachat thread ${thread.id}`, error)
    return undefined
  }
}

/**
 * The moderator's live thread, or undefined when there is none to resume.
 *
 * The sweep runs first and across every moderator, not only this one: scoped to the
 * caller it would never reach a moderator who stops opening the chat, and the retention
 * promise would be false for exactly the transcripts it is meant to reach. It is a
 * single indexed DELETE.
 *
 * Which thread is "the live one" is then a question for the database, not for a filter
 * in here: newest by `updated_at`, within the cutoff. A moderator can end up with more
 * than one row — two admin tabs both opening a chat, say — and the one he is working in
 * is the one he last wrote to.
 */
export async function findActiveThread(userId: number): Promise<CreaChatThreadState | undefined> {
  const cutoff = idleCutoff()

  const deleted = await dbDeleteCreachatThreadsUnusedSince(cutoff)
  if (deleted > 0) {
    logger.info(
      `deleted ${deleted} creachat thread(s) untouched for more than ${THREAD_IDLE_HOURS} hours`,
    )
  }

  const active = await dbSelectNewestLiveCreachatThread(userId, cutoff)
  if (!active.success) {
    return undefined
  }
  return { id: active.value.id, turns: parseTurns(active.value) ?? [] }
}

/** Loads one thread, scoped to its owner. Undefined when this moderator has no such thread. */
export async function findOwnThread(
  threadId: string,
  userId: number,
): Promise<CreaChatThreadState | undefined> {
  const result = await dbSelectCreachatThreadByIdAndUserId(threadId, userId)
  if (!result.success) {
    return undefined
  }
  return { id: result.value.id, turns: parseTurns(result.value) ?? [] }
}

/**
 * Opens a thread for this moderator and returns its id, or undefined when the insert
 * was rejected. Returned rather than thrown: a rejected insert is an expected runtime
 * outcome, and the resolver has an error code for it that reaches the moderator in his
 * own language.
 */
export async function createThread(userId: number): Promise<string | undefined> {
  const id = uuidv4()
  const result = await dbInsertCreachatThread({ id, userId, messages: '[]' })
  if (!result.success) {
    logger.error(`could not open a creachat thread for user ${userId}`, result.error)
    return undefined
  }
  logger.info(`opened creachat thread ${id}`)
  return id
}

/**
 * Appends turns to the moderator's own thread. The transcript is re-read first rather
 * than reused from the request, so an exchange another tab wrote while Crea was thinking
 * is usually picked up instead of being overwritten.
 *
 * Usually, not always: this is a read-modify-write without a lock, so two sends whose
 * answers arrive within the same few milliseconds can both read the same transcript and
 * the second write wins. The re-read narrows that window to the database round trip; it
 * does not close it. Closing it would mean a transaction with SELECT ... FOR UPDATE
 * around every append — a row lock in the request path, bought against a case that needs
 * two tabs on one thread answering at once, and that costs the losing side a log entry,
 * never the reply the moderator is reading.
 *
 * A thread that vanished mid-request (cleared in another tab) is logged and shrugged off:
 * Crea's answer already exists and is worth more to the moderator than the bookkeeping.
 * An unreadable transcript is the one case where we do nothing at all — writing over it
 * would turn "we cannot read your conversation" into "your conversation is gone".
 */
export async function appendTurns(
  threadId: string,
  userId: number,
  turns: CreaChatTurn[],
): Promise<void> {
  const stored = await dbSelectCreachatThreadByIdAndUserId(threadId, userId)
  if (!stored.success) {
    logger.warn(`cannot append to missing creachat thread ${threadId}`, stored.error)
    return
  }
  const previous = parseTurns(stored.value)
  if (!previous) {
    logger.error(`refusing to append over the unreadable transcript of creachat thread ${threadId}`)
    return
  }
  const result = await dbUpdateCreachatThreadMessages(
    threadId,
    userId,
    JSON.stringify([...previous, ...turns]),
  )
  if (!result.success) {
    logger.warn(`could not append to creachat thread ${threadId}`, result.error)
  }
}

/** Deletes the moderator's own thread. False when there was nothing of his to delete. */
export async function deleteOwnThread(threadId: string, userId: number): Promise<boolean> {
  const result = await dbDeleteCreachatThreadByIdAndUserId(threadId, userId)
  if (result.success) {
    logger.info(`deleted creachat thread ${threadId}`)
    return true
  }
  logger.warn(`no creachat thread ${threadId} for this moderator to delete`)
  return false
}

/**
 * The tail of the conversation that is sent along to the API.
 *
 * Trimming the head is safe because nothing durable lives there: the signature is a
 * placeholder the browser fills, and the language follows the pasted contribution. If a
 * per-thread fact is ever added, it belongs in the system prompt or a column — not in
 * turn 1, where the cut would eat it.
 */
export function historyForRequest(turns: CreaChatTurn[]): CreaChatTurn[] {
  const trimmed = turns.slice(-MAX_HISTORY_TURNS)

  let characters = trimmed.reduce((sum, turn) => sum + turn.content.length, 0)
  while (trimmed.length && characters > MAX_HISTORY_CHARS) {
    characters -= trimmed[0].content.length
    trimmed.shift()
  }

  // The API rejects a conversation that opens on an assistant turn. Turns are written in
  // pairs so the turn cut lands on a user turn, but the size cut above drops one at a
  // time and a history that ends up starting on an assistant turn must not become a 400.
  while (trimmed.length && trimmed[0].role !== 'user') {
    trimmed.shift()
  }

  if (trimmed.length < turns.length) {
    logger.info(
      `creachat history of ${turns.length} turns trimmed to ${trimmed.length} for the request`,
    )
  }
  return trimmed
}
