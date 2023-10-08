import { TransactionRecipe, getNextPendingTransaction } from '../controller/TransactionRecipe'
import { GradidoTransaction } from '../proto/3_3/GradidoTransaction'
import { sendMessage as iotaSendMessage } from '../client/IotaClient'
import { CrossGroupType } from '../proto/3_3/enum/CrossGroupType'
import { getDataSource } from '../typeorm/DataSource'
import { logger } from '../server/logger'
import { TransactionError } from '@/graphql/model/TransactionError'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { ConditionalSleepManager } from '@/utils/ConditionalSleepManager'

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

let running = true

export const TRANSMIT_TO_IOTA_SLEEP_CONDITION_KEY = 'transmitToIota'

export const stop = (): void => {
  running = false
}

export const transmitToIota = async (): Promise<void> => {
  logger.info('start iota message transmitter')
  // eslint-disable-next-line no-unmodified-loop-condition
  while (running) {
    try {
      const recipe = await getNextPendingTransaction()
      if (!recipe) {
        await ConditionalSleepManager.getInstance().sleep(
          TRANSMIT_TO_IOTA_SLEEP_CONDITION_KEY,
          //1000,
          100000,
        )
        continue
      }
      logger.info('transmit to iota', recipe)
      const recipeController = new TransactionRecipe(recipe)
      const { transaction, body } = recipeController.getGradidoTransaction()
      const messageBuffer = GradidoTransaction.encode(transaction).finish()
      
      if (body.type === CrossGroupType.LOCAL) {
        const resultMessage = await iotaSendMessage(
          messageBuffer,
          Buffer.from(recipe.senderCommunity.iotaTopic, 'hex'),
        )
        recipe.iotaMessageId = Buffer.from(resultMessage.messageId, 'hex')
        logger.info('transmitted Gradido Transaction to Iota', {
          id: recipe.id,
          messageId: resultMessage.messageId,
        })
        await getDataSource().manager.save(recipe)
      } else {
        throw new TransactionError(
          TransactionErrorType.NOT_IMPLEMENTED_YET,
          'other as crossGroupType Local not implemented yet',
        )
      }
    } catch (error) {
      logger.error('error while transmitting to iota ', error)
      await sleep(2000)
    }
  }
  logger.info(
    'end iota message transmitter, no further transaction will be transmitted. !!! Please restart Server !!!',
  )
}
