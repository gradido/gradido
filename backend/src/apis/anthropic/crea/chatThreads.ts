// AI-GENERATED — not an architecture reference
import {
  type CreachatThreadSelect,
  dbDeleteCreachatThreadByIdAndUserId,
  dbDeleteCreachatThreadsUnusedSince,
  dbInsertCreachatThread,
  dbSelectCreachatThreadByIdAndUserId,
  dbSelectCreachatThreadsByUserId,
  dbUpdateCreachatThreadMessages,
} from 'database'
import { getLogger } from 'log4js'
import { v4 as uuidv4 } from 'uuid'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

// CreaChat's view of a stored thread. The database layer answers which rows exist; the
// rules about what they mean — how long a chat may lie idle, how much of it travels to
// the API, how the transcript is encoded — live here, because they are rules about Crea.

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.anthropic.crea.chatThreads`)

/** A thread untouched for this long is thrown away, as the OpenAI threads were. */
const THREAD_TIMEOUT_DAYS = 60

/**
 * How many turns travel to the API. Everything stays stored — the moderator keeps his
 * full window — but a very long chat would otherwise resend more and more context on
 * every message. 60 turns are roughly 30 exchanges, far past the point where Bernd
 * advises clearing the chat anyway.
 */
const MAX_HISTORY_TURNS = 60

export interface CreaChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface CreaChatThreadState {
  id: string
  turns: CreaChatTurn[]
}

function idleCutoff(): Date {
  return new Date(Date.now() - THREAD_TIMEOUT_DAYS * 24 * 60 * 60 * 1000)
}

/** Reads the stored transcript, tolerating a row that somehow holds unusable JSON. */
function parseTurns(thread: CreachatThreadSelect): CreaChatTurn[] {
  try {
    const parsed: unknown = JSON.parse(thread.messages)
    if (!Array.isArray(parsed)) {
      throw new TypeError('stored transcript is not an array')
    }
    return parsed as CreaChatTurn[]
  } catch (error) {
    logger.error(`unreadable transcript in creachat thread ${thread.id}, starting empty`, error)
    return []
  }
}

/**
 * The moderator's newest live thread, or undefined when there is none to resume.
 *
 * Expired threads are swept here — all of them, not just the newest. A moderator can end
 * up with more than one (two admin tabs both opening a chat, say), and only ever checking
 * the newest would leave the rest lying around forever. The sweep only runs when there is
 * actually something to sweep, so the ordinary case stays a single read.
 */
export async function findActiveThread(userId: number): Promise<CreaChatThreadState | undefined> {
  const threads = await dbSelectCreachatThreadsByUserId(userId)
  const cutoff = idleCutoff()

  if (threads.some((thread) => thread.updatedAt < cutoff)) {
    const deleted = await dbDeleteCreachatThreadsUnusedSince(userId, cutoff)
    logger.info(
      `deleted ${deleted} creachat thread(s) untouched for more than ${THREAD_TIMEOUT_DAYS} days`,
    )
  }

  const active = threads.find((thread) => thread.updatedAt >= cutoff)
  return active ? { id: active.id, turns: parseTurns(active) } : undefined
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
  return { id: result.value.id, turns: parseTurns(result.value) }
}

/**
 * Opens a thread for this moderator and returns its id. A rejected insert on a freshly
 * drawn uuid leaves nothing to fall back on — there is no conversation to carry — so it
 * is thrown rather than returned; the resolver is the edge that turns it into a response.
 */
export async function createThread(userId: number): Promise<string> {
  const id = uuidv4()
  const result = await dbInsertCreachatThread({ id, userId, messages: '[]' })
  if (!result.success) {
    logger.error(`could not open a creachat thread for user ${userId}`, result.error)
    throw result.error
  }
  logger.info(`opened creachat thread ${id}`)
  return id
}

/**
 * Appends turns to the moderator's own thread. The transcript is re-read first rather
 * than reused from the request, so an exchange another tab wrote while Crea was thinking
 * survives instead of being overwritten.
 *
 * A thread that vanished mid-request (cleared in another tab) is logged and shrugged off:
 * Crea's answer already exists and is worth more to the moderator than the bookkeeping.
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
  const result = await dbUpdateCreachatThreadMessages(
    threadId,
    JSON.stringify([...parseTurns(stored.value), ...turns]),
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

/** The tail of the conversation that is sent along to the API. */
export function historyForRequest(turns: CreaChatTurn[]): CreaChatTurn[] {
  if (turns.length <= MAX_HISTORY_TURNS) {
    return turns
  }
  logger.info(
    `creachat history of ${turns.length} turns trimmed to the last ${MAX_HISTORY_TURNS} for the request`,
  )
  const trimmed = turns.slice(-MAX_HISTORY_TURNS)
  // The API rejects a conversation that opens on an assistant turn. Turns are written in
  // pairs so the cut lands on a user turn today, but a history that ever gets an odd
  // number of entries must not turn into a 400.
  while (trimmed.length && trimmed[0].role !== 'user') {
    trimmed.shift()
  }
  return trimmed
}
