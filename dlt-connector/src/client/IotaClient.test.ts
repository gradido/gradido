/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { sendDataMessage, getMessage } from '@/client/IotaClient'
import CONFIG from '@/config'
import { MessageWrapper } from '@iota/client/lib/types'

describe('apis/IotaClientSingleton/enabled', () => {
  describe('Hello World', () => {
    beforeEach(() => {
      CONFIG.IOTA_COMMUNITY_ALIAS = 'GRADIDO: TestHelloWelt2'
      CONFIG.IOTA_API_URL = 'https://chrysalis-nodes.iota.org'
    })

    const now = new Date()
    let messageId: string
    const messageString = 'Hello World - ' + now.toString()
    const messageHexString = Buffer.from(messageString, 'utf8').toString('hex')
    const indexHexString = Buffer.from(CONFIG.IOTA_COMMUNITY_ALIAS, 'utf8').toString('hex')
    let iotaMessage: MessageWrapper | undefined
    it('sends hello world message to iota tangle', async () => {
      iotaMessage = await sendDataMessage(messageString)
      expect(iotaMessage).toMatchObject({
        message: {
          payload: {
            data: messageHexString,
            index: indexHexString,
          },
        },
        messageId: expect.any(String),
      })
    })
    it('receives hello world message from iota tangle by message id', async () => {
      // get messageId from send call and if send call failed, use hardcoded message id from first sended hello world message
      // to able to test it even when send failed
      messageId =
        iotaMessage?.messageId ?? '5498130bc3918e1a7143969ce05805502417e3e1bd596d3c44d6a0adeea22710'
      iotaMessage = await getMessage(messageId)
      expect(iotaMessage).toMatchObject({
        message: {
          payload: {
            data: messageHexString,
            index: indexHexString,
          },
        },
        messageId,
      })
    })
  })
})
