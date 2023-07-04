/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { IotaClientSingleton } from '@/client/IotaClientSingleton'
import CONFIG from '@/config'

CONFIG.IOTA = true
CONFIG.IOTA_COMMUNITY_ALIAS = 'GRADIDO: TestHelloWelt2'
CONFIG.IOTA_API_URL = 'https://chrysalis-nodes.iota.org'

describe('apis/IotaClientSingleton/enabled', () => {
  describe('Hello World', () => {
    const now = new Date()
    let messageId: string
    const messageString = 'Hello World - ' + now.toString()
    const messageHexString = Buffer.from(messageString, 'utf8').toString('hex')
    const indexHexString = Buffer.from(CONFIG.IOTA_COMMUNITY_ALIAS, 'utf8').toString('hex')
    it('sends hello world message to iota tangle', async () => {
      const iotaMessage = await IotaClientSingleton.getInstance()?.sendDataMessage(messageString)
      expect(iotaMessage).toMatchObject({
        message: {
          payload: {
            data: messageHexString,
            index: indexHexString,
          },
        },
        messageId: expect.any(String),
      })
      messageId =
        iotaMessage?.messageId ?? '5498130bc3918e1a7143969ce05805502417e3e1bd596d3c44d6a0adeea22710'
    })
    it('receives hello world message from iota tangle by message id', async () => {
      const iotaMessage = await IotaClientSingleton.getInstance()?.getMessage(messageId)
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
