import { TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY } from '@/data/const'
import { TransactionRepository } from '@/data/Transaction.repository'
import { TransmitToIotaContext } from '@/interactions/transmitToIota/TransmitToIota.context'
import { InterruptiveSleepManager } from '@/manager/InterruptiveSleepManager'

import { logger } from '../logging/logger'

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

let running = true

export const stopTransmitToIota = (): void => {
  running = false
}
/**
 * check for pending transactions:
 * - if one found call TransmitToIotaContext
 * - if not, wait 1000 ms and try again
 * if a new transaction was added, the sleep will be interrupted
 */
export const transmitToIota = async (): Promise<void> => {
  logger.info('start iota message transmitter')
  // eslint-disable-next-line no-unmodified-loop-condition
  while (running) {
    try {
      while (true) {
        const recipe = await TransactionRepository.getNextPendingTransaction()
        if (!recipe) break
        const transmitToIotaContext = new TransmitToIotaContext(recipe)
        await transmitToIotaContext.run()
      }

      await InterruptiveSleepManager.getInstance().sleep(
        TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY,
        1000,
      )
    } catch (error) {
      logger.error('error while transmitting to iota, retry in 10 seconds ', error)
      await sleep(10000)
    }
  }
  logger.error(
    'end iota message transmitter, no further transaction will be transmitted. !!! Please restart Server !!!',
  )
}
