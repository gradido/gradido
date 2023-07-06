/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { IotaClientSingleton } from '@/client/IotaClientSingleton'
import CONFIG from '@/config'
import { logger } from '@/server/logger'

describe('apis/IotaClientSingleton/disabled', () => {
  beforeEach(() => {
    CONFIG.IOTA = false
  })
  it('getInstance return undefined if iota is disabled', () => {
    const spyLog = jest.spyOn(logger, 'info')
    expect(IotaClientSingleton.getInstance()).toBeUndefined()
    expect(spyLog).toHaveBeenCalledWith('Iota are disabled via config...')
  })
})

describe('apis/IotaClientSingleton/invalidIotaUrl', () => {
  beforeEach(() => {
    CONFIG.IOTA = true
    CONFIG.IOTA_API_URL = 'invalidUrl'
  })
  it('throw exception on invalid iota url', () => {
    // eslint-disable-next-line jest/unbound-method
    expect(IotaClientSingleton.getInstance).toThrow()
  })
})

describe('apis/IotaClientSingleton/enabled', () => {
  describe('Hello World', () => {
    beforeEach(() => {
      CONFIG.IOTA = true
      CONFIG.IOTA_COMMUNITY_ALIAS = 'GRADIDO: TestHelloWelt2'
      CONFIG.IOTA_API_URL = 'https://chrysalis-nodes.iota.org'
    })

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
