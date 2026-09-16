// AI-GENERATED — not an architecture reference
import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { ClientError, GraphQLClient, RawRequestOptions } from 'graphql-request'
import { getLogger } from 'log4js'
import { Result } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../../../config/const'
import { EncryptedTransferArgs } from '../../../../graphql/model/EncryptedTransferArgs'
import { ensureUrlEndsWithSlash } from '../../../../util/utilities'
import { memberAvatars as memberAvatarsQuery } from './query/memberAvatars'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.client.1_0.MemberAvatarsClient`)

/**
 * Why a request failed, without what it carried: graphql-request's own ClientError message
 * appends the whole request and response as JSON -- the token included.
 */
const describeFailure = (err: unknown): string => {
  if (err instanceof ClientError) {
    return err.response.errors?.[0]?.message ?? `GraphQL error (status ${err.response.status})`
  }
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err)
}

/**
 * Asks another community's federation module about the pictures of its members.
 *
 * ⛔ Every call takes a signal, and the signal is the time limit: graphql-request sets none
 * of its own. Without it a community that accepts the connection and never answers holds
 * the member's whole request -- this community's own faces included. Measured with this
 * graphql-request (5.0.0, cross-fetch/node-fetch) under Node 18.16: to a server that never
 * answers, a request with AbortSignal.timeout(300) rejects after ~300 ms with an AbortError;
 * without a signal it is still pending after 1.5 s.
 */
export class MemberAvatarsClient {
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
   * The answer token as the other community sent it, or why there is none. Never throws:
   * an unreachable, slow or refusing community is an expected outcome, and the one caller
   * that knows which community this is turns it into an XComRequestError.
   */
  async memberAvatars(
    args: EncryptedTransferArgs,
    signal: AbortSignal,
  ): Promise<Result<string, Error>> {
    logger.debug('memberAvatars against endpoint=', this.endpoint)
    try {
      const { data } = await this.client.rawRequest<{ memberAvatars: string }>({
        query: memberAvatarsQuery,
        variables: { args },
        // graphql-request 5 declares its own DOM types (dist/types.dom.d.ts), older than
        // AbortSignal.reason, so Node's AbortSignal does not match them by name. At runtime it
        // is the object node-fetch aborts on -- measured, see the class comment.
        signal: signal as RawRequestOptions['signal'],
      })
      if (!data?.memberAvatars) {
        return {
          success: false,
          error: new Error(`memberAvatars without response data from endpoint=${this.endpoint}`),
        }
      }
      return { success: true, value: data.memberAvatars }
    } catch (err) {
      return {
        success: false,
        error: new Error(
          `memberAvatars failed for endpoint=${this.endpoint}: ${describeFailure(err)}`,
        ),
      }
    }
  }
}
