/* eslint-disable @typescript-eslint/no-explicit-any */
import { sendDataMessage, getMessage } from '@/client/IotaClient'
import { CONFIG } from '@/config'
import { IndexationPayload } from '@iota/client/lib/types'
import { logger } from './server/logger'

async function main() {
  const now = new Date()
  const messageString = 'Hello World - ' + now.toString()
  const messageHexString = Buffer.from(messageString, 'utf8').toString('hex')
  const indexHexString = Buffer.from(CONFIG.IOTA_COMMUNITY_ALIAS, 'utf8').toString('hex')

  const iotaSendedMessage = await sendDataMessage(messageString)

  if (iotaSendedMessage && iotaSendedMessage.messageId) {
    logger.info('Hello World Message send to iota, get messageId: %s', iotaSendedMessage.messageId)

    const iotaReceivedMessage = await getMessage(iotaSendedMessage.messageId)
    const indexationPayload = iotaReceivedMessage.message.payload as IndexationPayload
    if (
      indexationPayload.index.toString() === indexHexString ||
      indexationPayload.data.toString() === messageHexString
    ) {
      logger.info('Hello World Message received unchanged from Iota')
    } else {
      logger.error('Hello World Message changed on Tangle!!!')
    }
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  // eslint-disable-next-line n/no-process-exit
  process.exit(1)
})
