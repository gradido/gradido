// AI-GENERATED — not an architecture reference
import { CreaChatInput } from '@input/CreaChatInput'
import { CreaChatMessage } from '@model/CreaChatMessage'
import { getLogger } from 'log4js'
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { AnthropicClient, CreaTruncatedError } from '@/apis/anthropic/AnthropicClient'
import {
  appendTurns,
  type CreaChatTurn,
  createThread,
  deleteOwnThread,
  findActiveThread,
  findOwnThread,
  historyForRequest,
} from '@/apis/anthropic/crea/chatThreads'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { Context, getUser } from '@/server/context'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.CreaChatResolver`)

/**
 * CreaChat — the moderator's running exchange with Crea in the admin chat window.
 *
 * This is the other half of Crea: the contribution window judges one contribution at a
 * time, this one carries a conversation. The moderator pastes a contribution, copies
 * Crea's draft to the participant, pastes the answer back, and Crea reformulates. The
 * evaluation resolver cannot do that by construction.
 *
 * The operations keep the names and shapes the admin already calls, so the chat window
 * itself stays as it is.
 */
@Resolver()
export class CreaChatResolver {
  /** The moderator's current conversation, or an empty list when there is none. */
  @Authorized([RIGHTS.AI_SEND_MESSAGE])
  @Query(() => [CreaChatMessage])
  async resumeChat(@Ctx() context: Context): Promise<CreaChatMessage[]> {
    if (!AnthropicClient.getInstance()) {
      return [CreaChatMessage.error('api_inactive')]
    }
    const thread = await findActiveThread(getUser(context).id)
    if (!thread) {
      return []
    }
    return thread.turns.map((turn) => new CreaChatMessage(turn.content, turn.role, thread.id))
  }

  /** Throws away the whole conversation, so the next message starts fresh. */
  @Authorized([RIGHTS.AI_SEND_MESSAGE])
  @Mutation(() => Boolean)
  async deleteThread(@Arg('threadId') threadId: string, @Ctx() context: Context): Promise<boolean> {
    return deleteOwnThread(threadId, getUser(context).id)
  }

  /**
   * Sends one message and returns Crea's answer. The whole conversation so far travels
   * to the API with it — the Messages API keeps no state — and both new turns are
   * appended to the stored thread afterwards.
   */
  @Authorized([RIGHTS.AI_SEND_MESSAGE])
  @Mutation(() => CreaChatMessage)
  async sendMessage(
    @Arg('input') { message, threadId }: CreaChatInput,
    @Ctx() context: Context,
  ): Promise<CreaChatMessage> {
    const client = AnthropicClient.getInstance()
    if (!client) {
      return CreaChatMessage.error('api_inactive')
    }
    const user = getUser(context)

    let turns: CreaChatTurn[] = []
    let ownThreadId: string | undefined
    if (threadId?.length) {
      // Scoped to the owner: a thread id is an identifier, not a permission.
      const thread = await findOwnThread(threadId, user.id)
      if (!thread) {
        return CreaChatMessage.error('thread_not_found')
      }
      ownThreadId = thread.id
      turns = thread.turns
    }

    let answer: string
    try {
      answer = await client.chatWithCrea(historyForRequest(turns), message)
    } catch (error) {
      logger.error('creachat: the call to Crea failed', error)
      return CreaChatMessage.error(
        error instanceof CreaTruncatedError ? 'output_too_long' : 'send_failed',
      )
    }
    // An empty answer would be stored and replayed on every later turn, and the API
    // rejects an empty content block - so one empty answer would wedge the thread for
    // good. Treat it as a failed call instead and leave the transcript as it was.
    if (!answer.trim()) {
      logger.error('creachat: Crea answered with empty text')
      return CreaChatMessage.error('send_failed')
    }

    // The thread is opened only now that there is something to put in it. Opened before
    // the call, every failed attempt would leave an empty row behind, and the next
    // resume would hand the moderator that orphan instead of the chat he was in.
    const activeThreadId = ownThreadId ?? (await createThread(user.id))
    if (!activeThreadId) {
      return CreaChatMessage.error('send_failed')
    }

    await appendTurns(activeThreadId, user.id, [
      { role: 'user', content: message },
      { role: 'assistant', content: answer },
    ])
    return new CreaChatMessage(answer, 'assistant', activeThreadId)
  }
}
