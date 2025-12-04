import { OpenaiThreads, User } from 'database'
import { OpenAI } from 'openai'
import { Message } from 'openai/resources/beta/threads/messages'

import { httpsAgent } from '@/apis/ConnectionAgents'
import { CONFIG } from '@/config'

import { Message as MessageModel } from './model/Message'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { getLogger } from 'log4js'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.openai.OpenaiClient`)
// this is the time after when openai is deleting an inactive thread
const OPENAI_AI_THREAD_DEFAULT_TIMEOUT_DAYS = 60

/**
 * The `OpenaiClient` class is a singleton that provides an interface to interact with the OpenAI API.
 * It ensures that only one instance of the client is created and used throughout the application.
 */
export class OpenaiClient {
  /**
   * The singleton instance of the `OpenaiClient`.
   */

  private static instance: OpenaiClient

  /**
   * The OpenAI client instance used to interact with the OpenAI API.
   */
  private openai: OpenAI

  /**
   * Private constructor to prevent direct instantiation.
   * Initializes the OpenAI client with the provided API key from the configuration.
   */
  private constructor() {
    this.openai = new OpenAI({ apiKey: CONFIG.OPENAI_API_KEY, httpAgent: httpsAgent })
  }

  /**
   * Retrieves the singleton instance of the `OpenaiClient`.
   * If the OpenAI integration is disabled via configuration or the API key is missing, it returns `undefined`.
   *
   * @returns {OpenaiClient | undefined} The singleton instance of the `OpenaiClient` or `undefined` if disabled.
   */
  public static getInstance(): OpenaiClient | undefined {
    if (!CONFIG.OPENAI_ACTIVE || !CONFIG.OPENAI_API_KEY) {
      logger.info(`openai are disabled via config...`)
      return
    }
    if (!OpenaiClient.instance) {
      OpenaiClient.instance = new OpenaiClient()
    }
    return OpenaiClient.instance
  }

  /**
   * Creates a new message thread with the initial message provided.
   *
   * @param {Message} initialMessage - The initial message to start the thread.
   * @returns {Promise<string>} A promise that resolves to the ID of the created message thread.
   */
  public async createThread(initialMessage: MessageModel, user: User): Promise<string> {
    const messageThread = await this.openai.beta.threads.create({
      messages: [initialMessage],
    })
    // store id in db because it isn't possible to list all open threads via openai api
    const openaiThreadEntity = OpenaiThreads.create()
    openaiThreadEntity.id = messageThread.id
    openaiThreadEntity.userId = user.id
    await openaiThreadEntity.save()

    logger.info(`Created new message thread: ${messageThread.id}`)
    return messageThread.id
  }

  /**
   * Resumes the last message thread for the given user.
   * @param user
   * @returns
   */
  public async resumeThread(user: User): Promise<MessageModel[]> {
    const openaiThreadEntity = await OpenaiThreads.findOne({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    })
    if (!openaiThreadEntity) {
      logger.warn(`No openai thread found for user: ${user.id}`)
      return []
    }
    if (openaiThreadEntity.updatedAt < new Date(Date.now() - OPENAI_AI_THREAD_DEFAULT_TIMEOUT_DAYS * 24 * 60 * 60 * 1000)) {
      logger.info(`Openai thread for user: ${user.id} is older than ${OPENAI_AI_THREAD_DEFAULT_TIMEOUT_DAYS} days, deleting...`)
      // let run async, because it could need some time, but we don't need to wait, because we create a new one nevertheless
      // biome-ignore lint/complexity/noVoid: start it intentionally async without waiting for result
      void this.deleteThread(openaiThreadEntity.id)
      return []
    }
    try {
      const threadMessages = (
        await this.openai.beta.threads.messages.list(openaiThreadEntity.id, { order: 'desc' })
      ).getPaginatedItems()

      logger.info(`Resumed thread: ${openaiThreadEntity.id}`)
      return threadMessages
        .map(
          (message) =>
            new MessageModel(
              this.messageContentToString(message),
              message.role,
              openaiThreadEntity.id,
            ),
        )
        .reverse()
    } catch (e) {
      if(e instanceof Error && e.toString().includes('No thread found with id')) {
        logger.info(`Thread not found: ${openaiThreadEntity.id}`)
        return []
      } 
      throw e
    }
  }

  public async deleteThread(threadId: string): Promise<boolean> {
    const [, result] = await Promise.all([
      OpenaiThreads.delete({ id: threadId }),
      this.openai.beta.threads.del(threadId),
    ])
    if (result.deleted) {
      logger.info(`Deleted thread: ${threadId}`)
      return true
    } else {
      logger.warn(`Failed to delete thread: ${threadId}, remove from db anyway`)
      return false
    }
  }

  public async addMessage(message: MessageModel, threadId: string): Promise<void> {
    const threadMessages = await this.openai.beta.threads.messages.create(threadId, message)
    logger.info(`Added message to thread: ${threadMessages.id}`)
  }

  public async runAndGetLastNewMessage(threadId: string): Promise<MessageModel> {
    const updateOpenAiThreadResolver = OpenaiThreads.update({ id: threadId }, { updatedAt: new Date() })
    const run = await this.openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: CONFIG.OPENAI_ASSISTANT_ID,
    })
    logger.info('run status:', run.status)

    const messagesPage = await this.openai.beta.threads.messages.list(threadId, { run_id: run.id })
    if (messagesPage.data.length > 1) {
      logger.warn(`More than one message in thread: ${threadId}, run: ${run.id}`, messagesPage.data)
    }
    const message = messagesPage.data.at(0)
    if (!message) {
      logger.warn(`No message in thread: ${threadId}, run: ${run.id}`, messagesPage.data)
      return new MessageModel('No Answer', 'assistant')
    }
    await updateOpenAiThreadResolver
    return new MessageModel(this.messageContentToString(message), 'assistant')
  }

  private messageContentToString(message: Message): string {
    if (message.content.length > 1) {
      logger.warn(`More than one content in message: ${message.id}`, message.content)
    }
    const firstContent = message.content.at(0)
    if (!firstContent) {
      logger.warn(`No content in message: ${message.id}`, message)
      return ''
    }
    if (firstContent.type === 'text') {
      if (firstContent.text.annotations.length > 1) {
        logger.info(`Annotations: ${JSON.stringify(firstContent.text.annotations, null, 2)}`)
      }
      return firstContent.text.value
    } else if (firstContent.type === 'refusal') {
      logger.info(`Refusal: ${firstContent.refusal}`)
      return firstContent.refusal
    } else {
      logger.error(`Unhandled content type: ${firstContent.type}`, firstContent)
      return ''
    }
  }
}
