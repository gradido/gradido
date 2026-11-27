import DHT from '@hyperswarm/dht'
import { cleanDB, testEnvironment, useFakeTimersForDrizzle } from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import {
  AppDatabase,
  CommunitiesSelect,
  dbReplaceHomeCommunitySigningKeys,
  dbSelectCommunities,
} from 'database'
import { validate as validateUUID, version as versionUUID } from 'uuid'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { startDHT } from './index'
import { validateCommunity } from './validateCommunity'

CONFIG.FEDERATION_DHT_SEED = '64ebcb0e3ad547848fef4197c6e2332f64ebcb0e3ad547848fef4197c6e2332f'

jest.mock('@hyperswarm/dht')
// asking a peer is tested on its own, in validateCommunity.test.ts
jest.mock('./validateCommunity', () => ({ validateCommunity: jest.fn() }))

const TEST_TOPIC = 'gradido_test_topic'

// ed25519 sizes, the home community insert validates them
const keyPairMock = {
  publicKey: Buffer.alloc(32, 'publicKey'),
  secretKey: Buffer.alloc(64, 'secretKey'),
}

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.dht_node`)

const serverListenSpy = jest.fn()

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

const socketEventMocks: { [key: string]: any } = {}

const socketOnMock = jest.fn().mockImplementation((key: string, callback) => {
  socketEventMocks[key] = callback
})

const socketWriteMock = jest.fn()

const nodeConnectMock = jest.fn().mockImplementation(() => {
  return {
    on: socketOnMock,
    once: socketOnMock,
    write: socketWriteMock,
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

let db: AppDatabase
let testEnv: any

beforeAll(async () => {
  testEnv = await testEnvironment()
  db = testEnv.db
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

describe('federation', () => {
  beforeAll(() => {
    useFakeTimersForDrizzle()
  })

  afterEach(() => {
    // print logs which where captured during test
    // printLogs()
    // clean logs after, else they will be printed in next test again
    // cleanLogs()
  })

  describe('call startDHT', () => {
    const hashSpy = jest.spyOn(DHT, 'hash')
    const keyPairSpy = jest.spyOn(DHT, 'keyPair')
    beforeEach(async () => {
      CONFIG.FEDERATION_COMMUNITY_URL = 'https://test.gradido.net'
      CONFIG.COMMUNITY_NAME = 'Gradido Test Community'
      CONFIG.COMMUNITY_DESCRIPTION = 'Community to test the federation'
      DHT.mockClear()
      jest.clearAllMocks()
      await cleanDB()
      await startDHT(TEST_TOPIC)
    })

    it('calls DHT.hash', () => {
      expect(hashSpy).toHaveBeenCalledWith(Buffer.from(TEST_TOPIC))
    })

    it('creates the key pair from the hex-decoded seed', () => {
      expect(keyPairSpy).toHaveBeenCalledWith(Buffer.from(CONFIG.FEDERATION_DHT_SEED, 'hex'))
    })

    it('initializes a new DHT object', () => {
      expect(DHT).toHaveBeenCalledWith({ keyPair: keyPairMock })
    })

    it('stores the home community in community table ', async () => {
      const result = await dbSelectCommunities().then(({ communities }) => communities)
      expect(result).toEqual([
        expect.objectContaining({
          id: expect.any(Number),
          foreign: false,
          url: 'https://test.gradido.net/api/',
          publicKey: keyPairMock.publicKey,
          privateKey: keyPairMock.secretKey,
          communityUuid: expect.any(String),
          authenticatedAt: null,
          name: 'Gradido Test Community',
          description: 'Community to test the federation',
          publicJwtKey: expect.stringContaining('-----BEGIN PUBLIC KEY-----'),
          privateJwtKey: expect.stringContaining('-----BEGIN PRIVATE KEY-----'),
          publicEncryptionKey: expect.any(Buffer),
          privateEncryptionKey: expect.any(Buffer),
          creationDate: expect.any(Date),
          createdAt: expect.any(Date),
          updatedAt: null,
        }),
      ])
      expect(validateUUID(result[0].communityUuid ? result[0].communityUuid : '')).toEqual(true)
      expect(versionUUID(result[0].communityUuid ? result[0].communityUuid : '')).toEqual(4)
    })

    describe('DHT node', () => {
      it('creates a server', () => {
        expect(nodeCreateServerMock).toHaveBeenCalled()
      })

      it('listens on the server', () => {
        expect(serverListenSpy).toHaveBeenCalled()
      })

      describe('timers', () => {
        beforeEach(() => {
          jest.runOnlyPendingTimers()
        })

        it('announces on topic', () => {
          expect(nodeAnnounceMock).toHaveBeenCalledWith(Buffer.from(TEST_TOPIC), keyPairMock)
        })

        it('looks up on topic', () => {
          expect(nodeLookupMock).toHaveBeenCalledWith(Buffer.from(TEST_TOPIC))
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
          expect(socketOnMock).toHaveBeenCalled()
        })

        describe('socket events', () => {
          describe('on data', () => {
            const remotePublicKey = Buffer.from('another-public-key')
            const url = 'http://localhost/api/'

            describe('with receiving data longer than an url may be', () => {
              const tooLong = `http://localhost/${'x'.repeat(239)}`
              beforeEach(async () => {
                jest.clearAllMocks()
                await socketEventMocks.data(Buffer.from(tooLong))
              })

              it('logs a warning and asks nobody', () => {
                expect(logger.warn).toHaveBeenCalledWith(
                  'received more than max allowed length of data buffer: 256 against 255 max allowed',
                )
                expect(validateCommunity).not.toHaveBeenCalled()
              })
            })

            describe('with receiving non ascii character', () => {
              beforeEach(async () => {
                jest.clearAllMocks()
                // containing non-ascii character copyright symbol, U+00A9
                await socketEventMocks.data(Buffer.from('48656C6C6F2C20C2A92048656C6C6F21', 'hex'))
              })

              it('logs the binary data as hex and asks nobody', () => {
                expect(logger.warn).toHaveBeenCalledWith(
                  'received non ascii character, content as hex: 48656c6c6f2c20c2a92048656c6c6f21',
                )
                expect(validateCommunity).not.toHaveBeenCalled()
              })
            })

            describe('with receiving no url', () => {
              beforeEach(async () => {
                jest.clearAllMocks()
                await socketEventMocks.data(Buffer.from('no url string'))
              })

              it('logs the received data', () => {
                expect(logger.info).toHaveBeenCalledWith('data: no url string')
              })

              it('logs a warning and asks nobody', () => {
                expect(logger.warn).toHaveBeenCalledWith('received invalid url: no url string')
                expect(validateCommunity).not.toHaveBeenCalled()
              })
            })

            describe('with receiving an url of another scheme than http', () => {
              beforeEach(async () => {
                jest.clearAllMocks()
                await socketEventMocks.data(Buffer.from('ftp://localhost/api/'))
              })

              it('logs a warning and asks nobody', () => {
                expect(logger.warn).toHaveBeenCalledWith(
                  'received invalid url: ftp://localhost/api/',
                )
                expect(validateCommunity).not.toHaveBeenCalled()
              })
            })

            describe('with receiving an url', () => {
              beforeEach(async () => {
                jest.clearAllMocks()
                await socketEventMocks.data(Buffer.from(url))
              })

              it('asks the peer at that url for its community infos, with its key', () => {
                expect(validateCommunity).toHaveBeenCalledTimes(1)
                expect(validateCommunity).toHaveBeenCalledWith(url, remotePublicKey)
              })

              it('asks the same peer again only once SUCCESSTIME has passed since it was asked', async () => {
                await socketEventMocks.data(Buffer.from(url))
                expect(validateCommunity).toHaveBeenCalledTimes(1)

                // the refresh of the successful nodes comes in between: the peer keeps its deadline
                jest.advanceTimersByTime(119999)
                await socketEventMocks.data(Buffer.from(url))
                expect(validateCommunity).toHaveBeenCalledTimes(1)

                jest.advanceTimersByTime(1)
                await socketEventMocks.data(Buffer.from(url))
                expect(validateCommunity).toHaveBeenCalledTimes(2)
              })

              it('asks no peer again whose request is still running when the refresh comes', async () => {
                const answers: (() => void)[] = []
                ;(validateCommunity as jest.Mock).mockImplementationOnce(
                  () => new Promise<void>((resolve) => answers.push(resolve)),
                )
                // another peer, asked halfway to the next refresh
                jest.advanceTimersByTime(60000)
                const otherKey = Buffer.from('other-public-key')
                serverEventMocks.connection({ remotePublicKey: otherKey, on: socketOnMock })
                const running = socketEventMocks.data(Buffer.from(url))
                expect(validateCommunity).toHaveBeenLastCalledWith(url, otherKey)

                // the refresh of the successful nodes, its request still unanswered
                jest.advanceTimersByTime(60000)
                await socketEventMocks.data(Buffer.from(url))
                expect(validateCommunity).toHaveBeenCalledTimes(2)

                for (const answer of answers) {
                  answer()
                }
                await running
              })
            })
          })

          describe('on open', () => {
            beforeEach(() => {
              socketEventMocks.open()
            })

            it('calls socket write with own federation url', () => {
              expect(socketWriteMock).toHaveBeenCalledWith(
                Buffer.from('https://test.gradido.net/api/'),
              )
            })
          })
        })
      })
    })

    describe('restart DHT', () => {
      let homeCommunity: CommunitiesSelect

      describe('without changes', () => {
        beforeEach(async () => {
          DHT.mockClear()
          jest.clearAllMocks()
          homeCommunity = (await dbSelectCommunities().then(({ communities }) => communities))[0]
          await startDHT(TEST_TOPIC)
        })

        it('does not change home community in community table', async () => {
          await expect(
            dbSelectCommunities().then(({ communities }) => communities),
          ).resolves.toEqual([homeCommunity])
        })
      })

      describe('home community with JWT key pair', () => {
        beforeEach(async () => {
          CONFIG.COMMUNITY_NAME = 'Renamed Gradido Test Community'
          DHT.mockClear()
          jest.clearAllMocks()
          homeCommunity = (await dbSelectCommunities().then(({ communities }) => communities))[0]
          await startDHT(TEST_TOPIC)
        })

        it('keeps the JWT key pair', async () => {
          await expect(
            dbSelectCommunities().then(({ communities }) => communities),
          ).resolves.toEqual([
            {
              ...homeCommunity,
              name: 'Renamed Gradido Test Community',
              updatedAt: expect.any(Date),
            },
          ])
        })
      })

      describe('with a seed that does not belong to the home community', () => {
        beforeEach(async () => {
          DHT.mockClear()
          jest.clearAllMocks()
          homeCommunity = (await dbSelectCommunities().then(({ communities }) => communities))[0]
          const otherKeyPair = {
            publicKey: Buffer.alloc(32, 'otherPublicKey'),
            secretKey: Buffer.alloc(64, 'otherSecretKey'),
          }
          // the decoded seed and the former fill-string seed alike
          DHT.keyPair.mockImplementationOnce(() => otherKeyPair)
          DHT.keyPair.mockImplementationOnce(() => otherKeyPair)
        })

        it('stops the start and keeps the keys of the home community', async () => {
          await expect(startDHT(TEST_TOPIC)).rejects.toThrow(
            'FEDERATION_DHT_SEED does not belong to the existing home community',
          )
          expect(DHT).not.toHaveBeenCalled()
          await expect(
            dbSelectCommunities().then(({ communities }) => communities),
          ).resolves.toEqual([homeCommunity])
        })
      })

      describe('with the key of the seed used as fill string, as until 10.2026', () => {
        const fillSeedKeyPair = {
          publicKey: Buffer.alloc(32, 'fillSeedPublicKey'),
          secretKey: Buffer.alloc(64, 'fillSeedSecretKey'),
        }
        beforeEach(async () => {
          DHT.mockClear()
          jest.clearAllMocks()
          await dbReplaceHomeCommunitySigningKeys(
            fillSeedKeyPair.publicKey,
            fillSeedKeyPair.secretKey,
          )
          homeCommunity = (await dbSelectCommunities().then(({ communities }) => communities))[0]
          DHT.keyPair.mockImplementation((seed: Buffer) =>
            seed.equals(Buffer.alloc(32, CONFIG.FEDERATION_DHT_SEED))
              ? fillSeedKeyPair
              : keyPairMock,
          )
          await startDHT(TEST_TOPIC)
        })

        afterEach(() => {
          DHT.keyPair.mockImplementation(() => keyPairMock)
        })

        it('replaces it once with the key of the decoded seed', async () => {
          await expect(
            dbSelectCommunities().then(({ communities }) => communities),
          ).resolves.toEqual([
            {
              ...homeCommunity,
              publicKey: keyPairMock.publicKey,
              privateKey: keyPairMock.secretKey,
              updatedAt: expect.any(Date),
            },
          ])
        })

        it('announces with the key of the decoded seed', () => {
          expect(DHT).toHaveBeenCalledWith({ keyPair: keyPairMock })
        })
      })

      describe('changeing URL, name and description', () => {
        beforeEach(async () => {
          CONFIG.FEDERATION_COMMUNITY_URL = 'https://test2.gradido.net'
          CONFIG.COMMUNITY_NAME = 'Second Gradido Test Community'
          CONFIG.COMMUNITY_DESCRIPTION = 'Another Community to test the federation'
          DHT.mockClear()
          jest.clearAllMocks()
          homeCommunity = (await dbSelectCommunities().then(({ communities }) => communities))[0]
          await startDHT(TEST_TOPIC)
        })

        it('updates URL, name, description and updated at columns  ', async () => {
          await expect(
            dbSelectCommunities().then(({ communities }) => communities),
          ).resolves.toEqual([
            {
              ...homeCommunity,
              url: 'https://test2.gradido.net/api/',
              name: 'Second Gradido Test Community',
              description: 'Another Community to test the federation',
              updatedAt: expect.any(Date),
            },
          ])
        })
      })
    })
  })
})
