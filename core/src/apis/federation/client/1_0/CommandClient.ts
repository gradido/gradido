import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { ClientError, GraphQLClient } from 'graphql-request'
import { getLogger } from 'log4js'
import { Result } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../../../config/const'
import { EncryptedTransferArgs } from '../../../../graphql/model/EncryptedTransferArgs'
import { ensureUrlEndsWithSlash } from '../../../../util/utilities'
import { sendCommand as sendCommandQuery } from './query/sendCommand'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.client.1_0.CommandClient`)

// Longer than this, what the other side named is written as its length.
const NAMED_ERROR_MAX_LENGTH = 1000

/**
 * What a failed request may tell the log and the caller. graphql-request's ClientError writes the
 * whole request into its message -- the document, and the variables with the sealed command, some
 * 100 KB with a chat picture (P7b) -- and the caller hands the error on: into the log of a failed
 * delivery, into the answer to the form. Taken from it are the status and the first error the
 * other side named, that one as its length where it is long.
 */
const requestFailure = (err: unknown): string => {
  if (!(err instanceof ClientError)) {
    return err instanceof Error ? err.message : 'Unknown error'
  }
  const named = err.response.errors?.[0]?.message
  if (!named) {
    return `GraphQL Error (Code: ${err.response.status})`
  }
  return `GraphQL Error (Code: ${err.response.status}): ${
    named.length > NAMED_ERROR_MAX_LENGTH ? `*** ${named.length} characters` : named
  }`
}

export class CommandClient {
  dbCom: DbFederatedCommunity
  endpoint: string
  client: GraphQLClient

  constructor(dbCom: DbFederatedCommunity) {
    this.dbCom = dbCom
    this.endpoint = ensureUrlEndsWithSlash(dbCom.endPoint).concat(dbCom.apiVersion).concat('/')
    this.client = new GraphQLClient(this.endpoint, {
      method: 'POST',
      jsonSerializer: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },
    })
  }

  /**
   * Sends the command: true where the other community ran it, and a STRING where it did not --
   * the error. Every string is an error here, which is why the command's answer never comes out
   * of this method; sendCommandForAnswer hands it over.
   */
  async sendCommand(args: EncryptedTransferArgs): Promise<string | boolean> {
    const answer = await this.sendCommandForAnswer(args)
    return answer.success ? true : answer.error
  }

  /**
   * Sends the command and hands back what the other community answered (`data`, null where it
   * answered nothing), or the error. The answer is the command's own: SendEmailCommand answers
   * what became of the mail about a message (E-034).
   */
  async sendCommandForAnswer(args: EncryptedTransferArgs): Promise<Result<string | null, string>> {
    logger.debug(`sendCommand at ${this.endpoint} for args:`, args)
    try {
      const result = await this.client.rawRequest<{
        sendCommand: { success: boolean; data?: string | null; error?: string }
      }>(sendCommandQuery, {
        args,
      })
      logger.debug('nach rawRequest: result', result)
      if (!result?.data?.sendCommand?.success) {
        const errmsg = 'sendCommand failed with response error: ' + result?.data?.sendCommand?.error
        logger.error(errmsg)
        return { success: false, error: errmsg }
      }
      logger.debug('sendCommand successfully started with endpoint', this.endpoint)
      return { success: true, value: result.data.sendCommand.data ?? null }
    } catch (err) {
      const failure = requestFailure(err)
      // The error itself only where it carries no request.
      logger.error('error on sendCommand: ', err instanceof ClientError ? failure : err)
      return { success: false, error: failure }
    }
  }
}
