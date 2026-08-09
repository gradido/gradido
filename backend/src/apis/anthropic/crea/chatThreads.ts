import { CreaChatThread } from 'database'
import { getLogger } from 'log4js'
import { v4 as uuidv4 } from 'uuid'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

// Thread storage for CreaChat. The OpenAI Assistants API held the conversation for us
// and handed back a thread id; the Anthropic Messages API is stateless, so the
// transcript lives in creachat_threads and travels with every request.

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

/** Reads the stored transcript, tolerating a row that somehow holds unusable JSON. */
function parseTurns(thread: CreaChatThread): CreaChatTurn[] {
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
 * Expired threads are swept here — all of them, not just the newest. A moderator can
 * end up with more than one (two admin tabs both opening a chat, say), and only ever
 * checking the newest would leave the rest lying around forever.
 */
export async function findActiveThread(userId: number): Promise<CreaChatThreadState | undefined> {
  const threads = await CreaChatThread.find({ where: { userId }, order: { createdAt: 'DESC' } })
  const expiry = new Date(Date.now() - THREAD_TIMEOUT_DAYS * 24 * 60 * 60 * 1000)

  const expired = threads.filter((thread) => thread.updatedAt < expiry)
  if (expired.length) {
    logger.info(
      `deleting ${expired.length} creachat thread(s) untouched for more than ${THREAD_TIMEOUT_DAYS} days`,
    )
    await CreaChatThread.delete(expired.map((thread) => thread.id))
  }

  const active = threads.find((thread) => thread.updatedAt >= expiry)
  return active ? { id: active.id, turns: parseTurns(active) } : undefined
}

/**
 * Loads one thread, scoped to its owner. A moderator may only ever read, extend or
 * delete his own conversation — the id alone is not authorisation.
 */
export async function findOwnThread(
  threadId: string,
  userId: number,
): Promise<CreaChatThreadState | undefined> {
  const thread = await CreaChatThread.findOneBy({ id: threadId, userId })
  return thread ? { id: thread.id, turns: parseTurns(thread) } : undefined
}

/** Opens a thread for this moderator and returns its id. */
export async function createThread(userId: number): Promise<string> {
  const thread = CreaChatThread.create({ id: uuidv4(), userId, messages: '[]' })
  await CreaChatThread.save(thread)
  logger.info(`opened creachat thread ${thread.id}`)
  return thread.id
}

/** Appends turns to a thread and marks it as used. */
export async function appendTurns(threadId: string, turns: CreaChatTurn[]): Promise<void> {
  const thread = await CreaChatThread.findOneBy({ id: threadId })
  if (!thread) {
    logger.warn(`cannot append to missing creachat thread ${threadId}`)
    return
  }
  thread.messages = JSON.stringify([...parseTurns(thread), ...turns])
  await CreaChatThread.save(thread)
}

/** Deletes the moderator's own thread. False when there was nothing of his to delete. */
export async function deleteOwnThread(threadId: string, userId: number): Promise<boolean> {
  const result = await CreaChatThread.delete({ id: threadId, userId })
  if (result.affected) {
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
  // The API rejects a conversation that opens on an assistant turn. Turns are written
  // in pairs so the cut lands on a user turn today, but a history that ever gets an odd
  // number of entries must not turn into a 400.
  while (trimmed.length && trimmed[0].role !== 'user') {
    trimmed.shift()
  }
  return trimmed
}
