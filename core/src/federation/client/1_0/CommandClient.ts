import { EncryptedTransferArgs } from '../../../graphql/model/EncryptedTransferArgs'
import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { GraphQLClient } from 'graphql-request'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../../config/const'
import { sendCommand as sendCommandQuery} from './query/sendCommand'
import { ensureUrlEndsWithSlash } from '../../../util/utilities'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.client.1_0.CommandClient`)

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

  async sendCommand(args: EncryptedTransferArgs): Promise<boolean> {
    logger.debug(`sendCommand at ${this.endpoint} for args:`, args)
    try {
      const { data } = await this.client.rawRequest<{ success: boolean }>(sendCommandQuery, {
        args,
      })
      if (!data?.success) {
        logger.warn('sendCommand without response data from endpoint', this.endpoint)
        return false
      }
      logger.debug('sendCommand successfully started with endpoint', this.endpoint)
      return true
    } catch (err) {
      logger.error('error on sendCommand: ', err)
      return false
    }
  }
}
