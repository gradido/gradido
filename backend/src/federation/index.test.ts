import { startDHT } from './index'
import DHT from '@hyperswarm/dht'
import CONFIG from '@/config'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { logger } from '@test/testSetup'

CONFIG.FEDERATION_DHT_SEED = '64ebcb0e3ad547848fef4197c6e2332f'

jest.mock('@hyperswarm/dht')
jest.useFakeTimers()

const TEST_TOPIC = 'gradido_test_topic'

const keyPairMock = {
  publicKey: Buffer.from('publicKey'),
  secretKey: Buffer.from('secretKey'),
}

const serverListenSpy = jest.fn()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serverEventMocks: { [key: string]: any } = {}

const serverOnMock = jest.fn().mockImplementation((key: string, callback) => {
  serverEventMocks[key] = callback
})

const nodeCreateServerMock = jest.fn().mockImplementation(() => {
  return {
    on: serverOnMock,
    listen: serverListenSpy,
  }
})

const nodeAnnounceMock = jest.fn().mockImplementation(() => {
  return {
    finished: jest.fn(),
  }
})

const lookupResultMock = {
  token: Buffer.from(TEST_TOPIC),
  from: {
    id: Buffer.from('somone'),
    host: '188.95.53.5',
    port: 63561,
  },
  to: { id: null, host: '83.53.31.27', port: 55723 },
  peers: [
    {
      publicKey: Buffer.from('some-public-key'),
      relayAddresses: [],
    },
  ],
}

const nodeLookupMock = jest.fn().mockResolvedValue([lookupResultMock])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const socketEventMocks: { [key: string]: any } = {}

const socketOnMock = jest.fn().mockImplementation((key: string, callback) => {
  socketEventMocks[key] = callback
})

const nodeConnectMock = jest.fn().mockImplementation(() => {
  return {
    on: socketOnMock,
    once: socketOnMock,
  }
})

DHT.hash.mockImplementation(() => {
  return Buffer.from(TEST_TOPIC)
})

DHT.keyPair.mockImplementation(() => {
  return keyPairMock
})

DHT.mockImplementation(() => {
  return {
    createServer: nodeCreateServerMock,
    announce: nodeAnnounceMock,
    lookup: nodeLookupMock,
    connect: nodeConnectMock,
  }
})

describe('federation', () => {
  describe('call startDHT', () => {
    const hashSpy = jest.spyOn(DHT, 'hash')
    const keyPairSpy = jest.spyOn(DHT, 'keyPair')

    beforeEach(async () => {
      DHT.mockClear()
      jest.clearAllMocks()
      await startDHT(TEST_TOPIC)
    })

    it('calls DHT.hash', () => {
      expect(hashSpy).toBeCalledWith(Buffer.from(TEST_TOPIC))
    })

    it('creates a key pair', () => {
      expect(keyPairSpy).toBeCalledWith(expect.any(Buffer))
    })

    it('initializes a new DHT object', () => {
      expect(DHT).toBeCalledWith({ keyPair: keyPairMock })
    })

    describe('DHT node', () => {
      it('creates a server', () => {
        expect(nodeCreateServerMock).toBeCalled()
      })

      it('listens on the server', () => {
        expect(serverListenSpy).toBeCalled()
      })

      describe('timers', () => {
        beforeEach(() => {
          jest.runOnlyPendingTimers()
        })

        it('announces on topic', () => {
          expect(nodeAnnounceMock).toBeCalledWith(Buffer.from(TEST_TOPIC), keyPairMock)
        })

        it('looks up on topic', () => {
          expect(nodeLookupMock).toBeCalledWith(Buffer.from(TEST_TOPIC))
        })
      })

      describe('server connection event', () => {
        beforeEach(() => {
          serverEventMocks.connection({
            remotePublicKey: Buffer.from('another-public-key'),
            on: socketOnMock,
          })
        })

        it('can be triggered', () => {
          expect(socketOnMock).toBeCalled()
        })

        describe('socket events', () => {
          describe('on data', () => {
            beforeEach(() => {
              socketEventMocks.data(Buffer.from('some-data'))
            })

            it('can be triggered', () => {
              expect(true).toBe(true)
            })
          })
        })
      })
    })
  })
})
