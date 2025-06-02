import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { GraphQLClient } from 'graphql-request'

import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'
import { ensureUrlEndsWithSlash } from '@/util/utilities'

import { DisbursementJwtResultLoggingView } from './logging/DisbursementJwtResultLogging.view'
import { DisbursementJwtResult } from './model/DisbursementJwtResult'
import { disburseJwt as disburseJwtQuery } from './query/disburseJwt'

export class DisbursementClient {
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

  async disburseJwt(jwt: string): Promise<DisbursementJwtResult> {
    logger.debug('X-Com: disburse against endpoint=', this.endpoint)
    try {
      logger.debug(`X-Com: DisbursementClient: disburse with jwt=`, jwt)
      const { data } = await this.client.rawRequest<{ disburseJwtResult: DisbursementJwtResult }>(
        disburseJwtQuery,
        { arg: jwt },
      )
      logger.debug('X-Com: DisbursementClient: disburse data=', data)
      const result = data.disburseJwt as DisbursementJwtResult
      logger.debug('X-Com: DisbursementClient: disburse result=', result)
      if (!result.accepted) {
        logger.debug('X-Com: disburse failed with: ', new DisbursementJwtResultLoggingView(result))
        return new DisbursementJwtResult()
      }
      logger.debug(
        'X-Com: disburse successful with result=',
        new DisbursementJwtResultLoggingView(result),
      )
      return result
    } catch (err) {
      throw new LogError(`X-Com: disburse failed for endpoint=${this.endpoint}:`, err)
    }
  }
}
