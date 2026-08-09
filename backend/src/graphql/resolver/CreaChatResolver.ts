import { CreaChatInput } from '@input/CreaChatInput'
import { CreaChatMessage } from '@model/CreaChatMessage'
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { AnthropicClient } from '@/apis/anthropic/AnthropicClient'
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
import { Context } from '@/server/context'

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
    if (!context.user) {
      return [CreaChatMessage.error('user_not_found')]
    }
    const thread = await findActiveThread(context.user.id)
    if (!thread) {
      return []
    }
    return thread.turns.map((turn) => new CreaChatMessage(turn.content, turn.role, thread.id))
  }

  /** Throws away the whole conversation, so the next message starts fresh. */
  @Authorized([RIGHTS.AI_SEND_MESSAGE])
  @Mutation(() => Boolean)
  async deleteThread(@Arg('threadId') threadId: string, @Ctx() context: Context): Promise<boolean> {
    if (!context.user) {
      return false
    }
    return deleteOwnThread(threadId, context.user.id)
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
    if (!context.user) {
      return CreaChatMessage.error('user_not_found')
    }

    let turns: CreaChatTurn[] = []
    let activeThreadId: string
    if (threadId?.length) {
      // Scoped to the owner: a thread id is an identifier, not a permission.
      const thread = await findOwnThread(threadId, context.user.id)
      if (!thread) {
        return CreaChatMessage.error('thread_not_found')
      }
      activeThreadId = thread.id
      turns = thread.turns
    } else {
      activeThreadId = await createThread(context.user.id)
    }

    const answer = await client.chatWithCrea(historyForRequest(turns), message)
    await appendTurns(activeThreadId, [
      { role: 'user', content: message },
      { role: 'assistant', content: answer },
    ])
    return new CreaChatMessage(answer, 'assistant', activeThreadId)
  }
}
