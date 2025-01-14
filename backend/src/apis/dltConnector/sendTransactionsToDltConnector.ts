// eslint-disable-next-line import/no-extraneous-dependencies
import { CONFIG } from '@/config'
import { backendLogger as logger } from '@/server/logger'
import { TypeORMError } from '@dbTools/typeorm'
// eslint-disable-next-line import/named, n/no-extraneous-import
import { FetchError } from 'node-fetch'

import { DltConnectorClient } from '@dltConnector/DltConnectorClient'

import { LogError } from '@/server/LogError'
import {
  InterruptiveSleepManager,
  TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY,
} from '@/util/InterruptiveSleepManager'

import { transactionToDlt } from './interaction/transactionToDlt/transactionToDlt.context'

let isLoopRunning = true

export const stopSendTransactionsToDltConnector = (): void => {
  isLoopRunning = false
}

export async function sendTransactionsToDltConnector(): Promise<void> {
  const dltConnector = DltConnectorClient.getInstance()

  if (!dltConnector) {
    logger.info('Sending to DltConnector currently not configured...')
    isLoopRunning = false
    return
  }
  logger.info('Starting sendTransactionsToDltConnector task')

  // define outside of loop for reuse and reducing gb collection
  // const queries = getFindNextPendingTransactionQueries()

  // eslint-disable-next-line no-unmodified-loop-condition
  while (isLoopRunning) {
    try {
      // return after no pending transactions are left
      await transactionToDlt(dltConnector)
      await InterruptiveSleepManager.getInstance().sleep(
        TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY,
        // TODO: put sleep time into config, because it influence performance,
        // transactionToDlt call 4 db queries to look for new transactions
        CONFIG.PRODUCTION ? 100000 : 1000,
      )
    } catch (e) {
      // couldn't connect to dlt-connector? We wait
      if (e instanceof FetchError) {
        logger.error(`error connecting dlt-connector, wait 5 seconds before retry: ${String(e)}`)
        await InterruptiveSleepManager.getInstance().sleep(
          TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY,
          5000,
        )
      } else {
        if (e instanceof TypeORMError) {
          // seems to be a error in code, so let better stop here
          throw new LogError(e.message, e.stack)
        } else {
          logger.error(`Error while sending to DLT-connector or writing messageId`, e)
        }
      }
    }
  }
}
