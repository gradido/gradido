import { TransactionRecipe, getNextPendingTransaction } from '../controller/TransactionRecipe'
import { GradidoTransaction } from '../proto/3_3/GradidoTransaction'
import { sendMessage as iotaSendMessage } from '../client/IotaClient'
import { CrossGroupType } from '../proto/3_3/enum/CrossGroupType'
import { getDataSource } from '../typeorm/DataSource'
import { logger } from '../server/logger'
import { TransactionError } from '@/graphql/model/TransactionError'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { ConditionalSleepManager } from '@/utils/ConditionalSleepManager'
import { verify as ed25519Verify } from 'bip32-ed25519'
import { TransactionBody } from '@/proto/3_3/TransactionBody'

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
          1000,
        )
        continue
      }
      logger.info('transmit to iota', recipe)
      const recipeController = new TransactionRecipe(recipe)
      const { transaction, body } = recipeController.getGradidoTransaction()
      const messageBuffer = GradidoTransaction.encode(transaction).finish()
      const transactionDecoded = GradidoTransaction.decode(messageBuffer)
      const bodyDecoded = TransactionBody.decode(transactionDecoded.bodyBytes)
      if (transactionDecoded.sigMap.sigPair[0].signature.length !== 64) {
        throw new TransactionError(
          TransactionErrorType.INVALID_SIGNATURE,
          'signature size on decoded transaction is wrong!',
        )
      }
      console.log('signature: %s', transactionDecoded.sigMap.sigPair[0].signature.toString('hex'))
      console.log('message buffer: \n%s', Buffer.from(messageBuffer).toString('hex'))
      const verified = ed25519Verify(
        transactionDecoded.bodyBytes,
        transactionDecoded.sigMap.sigPair[0].signature,
        transactionDecoded.sigMap.sigPair[0].pubKey,
      )
      console.log('result from verified: %d', verified)
      console.log('bodyBytes: %s', transactionDecoded.bodyBytes.toString('hex'))
      console.log('publickey: %s', transactionDecoded.sigMap.sigPair[0].pubKey.toString('hex'))
      console.log('signature: %s', transactionDecoded.sigMap.sigPair[0].signature.toString('hex'))
      console.log('json: %s', JSON.stringify(transactionDecoded.toJSON(), null, 2))
      console.log('json body: %s', JSON.stringify(bodyDecoded.toJSON(), null, 2))
      const bodyBytesReincoded = TransactionBody.encode(bodyDecoded).finish()
      console.log('body bytes new: %s', Buffer.from(bodyBytesReincoded).toString('base64'))

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
