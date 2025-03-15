import { Resolver, Mutation, Authorized, Ctx, Arg } from 'type-graphql'

import { OpenaiMessage } from '@input/OpenaiMessage'
import { ChatGptMessage } from '@model/ChatGptMessage'

import { Message } from '@/apis/openai/model/Message'
import { OpenaiClient } from '@/apis/openai/OpenaiClient'
import { RIGHTS } from '@/auth/RIGHTS'
import { Context } from '@/server/context'

@Resolver()
export class AiChatResolver {
  @Authorized([RIGHTS.AI_SEND_MESSAGE])
  @Mutation(() => ChatGptMessage)
  async sendMessage(
    @Arg('input') { message, threadId = null }: OpenaiMessage,
    @Ctx() context: Context,
  ): Promise<ChatGptMessage> {
    const openaiClient = OpenaiClient.getInstance()
    if (!openaiClient) {
      return Promise.resolve(new ChatGptMessage({ content: 'OpenAI API is not enabled' }))
    }
    if (!context.user) {
      return Promise.resolve(new ChatGptMessage({ content: 'User not found' }))
    }
    const messageObj = new Message(message)
    if (!threadId || threadId.length === 0) {
      threadId = await openaiClient.createThread(messageObj, context.user)
    } else {
      await openaiClient.addMessage(messageObj, threadId)
    }
    const resultMessage = new ChatGptMessage(await openaiClient.runAndGetLastNewMessage(threadId))
    resultMessage.threadId = threadId
    return resultMessage
  }
}
