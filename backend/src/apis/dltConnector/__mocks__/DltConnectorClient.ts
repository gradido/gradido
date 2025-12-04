import { getLogger } from 'log4js'
import { IRestResponse } from 'typed-rest-client'
import { TransactionDraft } from '@/apis/dltConnector/model/TransactionDraft'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.dltConnector`)

// Source: https://refactoring.guru/design-patterns/singleton/typescript/example
// and ../federation/client/FederationClientFactory.ts
/**
 * A Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */

export class DltConnectorClient {
  private static instance: DltConnectorClient
  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */

  private constructor() {}

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(): DltConnectorClient | undefined {
    if (!CONFIG.DLT_ACTIVE || !CONFIG.DLT_CONNECTOR_URL) {
      logger.info(`dlt-connector are disabled via config...`)
      return
    }
    if (!DltConnectorClient.instance) {
      DltConnectorClient.instance = new DltConnectorClient()
    }
    return DltConnectorClient.instance
  }

  /**
   * transmit transaction via dlt-connector to hiero
   * and update dltTransactionId of transaction in db with hiero transaction id
   */
  public async sendTransaction(input: TransactionDraft): Promise<IRestResponse<string>> {
    logger.debug('transmit transaction or user to dlt connector', input)
    return Promise.resolve({
      statusCode: 200,
      result: 'test',
      headers: {},
    })
  }
}
