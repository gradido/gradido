import { Transaction } from '@entity/Transaction'

import { logger } from '@/logging/logger'
import { TransactionLoggingView } from '@/logging/TransactionLogging.view'

/**
 * @DCI-Context
 * Context for sending transaction recipe to iota
 * send every transaction only once to iota!
 */
export class TransmitToIotaContext {
  // eslint-disable-next-line no-useless-constructor
  public constructor(private transaction: Transaction) {
    
  }

  public async run(): Promise<void> {
    logger.info('transmit to iota', new TransactionLoggingView(this.transaction))
    const recipeController = new TransactionRecipe(recipe)
    const { transaction, body } = recipeController.getGradidoTransaction()
    const messageBuffer = GradidoTransaction.encode(transaction).finish()

    if (body.type === CrossGroupType.LOCAL) {
      const resultMessage = await iotaSendMessage(
        messageBuffer,
        Buffer.from(recipe.community.iotaTopic, 'hex'),
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
  }
}
