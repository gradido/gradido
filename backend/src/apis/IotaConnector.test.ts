import { IndexationPayload } from '@iota/client/lib/types'

import { sendDataMessage, getMessage, getAllMessages } from '@/apis/IotaConnector'
import { CONFIG } from '@/config'

jest.mock('@/config', () => ({
  CONFIG: {
    IOTA: true,
    IOTA_COMMUNITY_ALIAS: 'GRADIDO: TestHelloWelt1',
    IOTA_API_URL: 'https://chrysalis-nodes.iota.org',
  },
}))

describe('apis/IotaConnector/enabled', () => {
  describe('Hello World', () => {
    const now = new Date()
    let messageId = ''
    const messageString = 'Hello World - ' + now.toString()
    const messageHexString = Buffer.from(messageString, 'utf8').toString('hex')
    const indexHexString = Buffer.from(CONFIG.IOTA_COMMUNITY_ALIAS, 'utf8').toString('hex')
    it('sends hello world message to iota tangle', async () => {
      const iotaMessage = await sendDataMessage(messageString)
      expect(iotaMessage).not.toBeNull()
      if (iotaMessage) {
        const indexationPayload = iotaMessage.message.payload as IndexationPayload
        expect(indexationPayload.data).toBe(messageHexString)
        expect(indexationPayload.index).toBe(indexHexString)
        messageId = iotaMessage.messageId
      }
    })
    it('receives hello world message from iota tangle by message id', async () => {
      const iotaMessage = await getMessage(messageId)
      expect(iotaMessage).not.toBeNull()
      if (iotaMessage) {
        const indexationPayload = iotaMessage.message.payload as IndexationPayload
        expect(indexationPayload.data).toBe(messageHexString)
        expect(indexationPayload.index).toBe(indexHexString)
      }
    })
    it('receive hello world message from iota tangle by searching throw all', async () => {
      const iotaMessages = await getAllMessages()
      expect(iotaMessages).not.toBeNull()
      if (iotaMessages) {
        let foundMessage = false
        for (const messageId of iotaMessages) {
          const iotaMessage = await getMessage(messageId)
          if (iotaMessage) {
            const indexationPayload = iotaMessage.message.payload as IndexationPayload
            if (indexationPayload.data.toString() === messageHexString) {
              foundMessage = true
              break
            }
          }
        }
        expect(foundMessage).toBeTruthy()
      }
    })
  })
})
