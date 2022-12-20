/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { startDHT } from './index'
import DHT from '@hyperswarm/dht'
import CONFIG from '@/config'
import { logger } from '@test/testSetup'
import { Community as DbCommunity } from '@entity/Community'
import { testEnvironment, cleanDB } from '@test/helpers'

CONFIG.FEDERATION_DHT_SEED = '64ebcb0e3ad547848fef4197c6e2332f'
CONFIG.FEDERATION_DHT_TEST_SOCKET = false

jest.mock('@hyperswarm/dht')

const TEST_TOPIC = 'gradido_test_topic'

const keyPairMock = {
  publicKey: Buffer.from('publicKey'),
  secretKey: Buffer.from('secretKey'),
}

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

let con: any
let testEnv: any

beforeAll(async () => {
  testEnv = await testEnvironment(logger)
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await con.close()
})

describe('federation', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

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
            describe('with receiving simply a string', () => {
              beforeEach(() => {
                jest.clearAllMocks()
                socketEventMocks.data(Buffer.from('no-json string'))
              })

              it('logs the received data', () => {
                expect(logger.info).toBeCalledWith('data: no-json string')
              })

              it('logs an error of unexpected data format and structure', () => {
                expect(logger.error).toBeCalledWith(
                  'Error on receiving data from socket:',
                  new SyntaxError('Unexpected token o in JSON at position 1'),
                )
              })
            })

            describe('with receiving array of strings', () => {
              beforeEach(() => {
                jest.clearAllMocks()
                const strArray: string[] = ['invalid type test', 'api', 'url']
                socketEventMocks.data(Buffer.from(strArray.toString()))
              })

              it('logs the received data', () => {
                expect(logger.info).toBeCalledWith('data: invalid type test,api,url')
              })

              it('logs an error of unexpected data format and structure', () => {
                expect(logger.error).toBeCalledWith(
                  'Error on receiving data from socket:',
                  new SyntaxError('Unexpected token i in JSON at position 0'),
                )
              })
            })

            describe('with receiving array of string-arrays', () => {
              beforeEach(() => {
                jest.clearAllMocks()
                const strArray: string[][] = [
                  [`api`, `url`, `invalid type in array test`],
                  [`wrong`, `api`, `url`],
                ]
                socketEventMocks.data(Buffer.from(strArray.toString()))
              })

              it('logs the received data', () => {
                expect(logger.info).toBeCalledWith(
                  'data: api,url,invalid type in array test,wrong,api,url',
                )
              })

              it('logs an error of unexpected data format and structure', () => {
                expect(logger.error).toBeCalledWith(
                  'Error on receiving data from socket:',
                  new SyntaxError('Unexpected token a in JSON at position 0'),
                )
              })
            })

            describe('with receiving JSON-Array with too much entries', () => {
              let jsonArray: { api: string; url: string }[]
              beforeEach(() => {
                jest.clearAllMocks()
                jsonArray = [
                  { api: 'v1_0', url: 'too much versions at the same time test' },
                  { api: 'v1_0', url: 'url2' },
                  { api: 'v1_0', url: 'url3' },
                  { api: 'v1_0', url: 'url4' },
                  { api: 'v1_0', url: 'url5' },
                  { api: 'v1_0', url: 'url6' },
                ]
                socketEventMocks.data(Buffer.from(JSON.stringify(jsonArray)))
              })

              it('logs the received data', () => {
                expect(logger.info).toBeCalledWith(
                  'data: [{"api":"v1_0","url":"too much versions at the same time test"},{"api":"v1_0","url":"url2"},{"api":"v1_0","url":"url3"},{"api":"v1_0","url":"url4"},{"api":"v1_0","url":"url5"},{"api":"v1_0","url":"url6"}]',
                )
              })

              it('logs a warning of too much apiVersion-Definitions', () => {
                expect(logger.warn).toBeCalledWith(
                  `received totaly wrong or too much apiVersions-Definition JSON-String:${JSON.stringify(
                    jsonArray,
                  )}`,
                )
              })
            })

            describe('with receiving wrong but tolerated property test', () => {
              let jsonArray: any[]
              let result: DbCommunity[] = []
              beforeEach(async () => {
                jest.clearAllMocks()
                jsonArray = [
                  {
                    wrong: 'wrong but tolerated property test',
                    api: 'v1_0',
                    url: 'url1',
                  },
                  {
                    api: 'v2_0',
                    url: 'url2',
                    wrong: 'wrong but tolerated property test',
                  },
                ]
                console.log(`jsonArray ${JSON.stringify(jsonArray)}`)
                socketEventMocks.data(Buffer.from(JSON.stringify(jsonArray)))
                result = await DbCommunity.find()
              })

              afterAll(async () => {
                await cleanDB()
              })

              it('logs the received data', () => {
                expect(logger.info).toBeCalledWith(
                  'data: [{"wrong":"wrong but tolerated property test","api":"v1_0","url":"url1"},{"api":"v2_0","url":"url2","wrong":"wrong but tolerated property test"}]',
                )
              })

              it('has two Communty entries in database', () => {
                expect(result).toHaveLength(2)
              })

              it('has an entry for api version v1_0', () => {
                expect(result).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: expect.any(Number),
                      publicKey: expect.any(Buffer),
                      apiVersion: 'v1_0',
                      endPoint: 'url1',
                      lastAnnouncedAt: expect.any(Date),
                      createdAt: expect.any(Date),
                      updatedAt: null,
                    }),
                  ]),
                )
              })

              it('has an entry for api version v2_0', () => {
                expect(result).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: expect.any(Number),
                      publicKey: expect.any(Buffer),
                      apiVersion: 'v2_0',
                      endPoint: 'url2',
                      lastAnnouncedAt: expect.any(Date),
                      createdAt: expect.any(Date),
                      updatedAt: null,
                    }),
                  ]),
                )
              })
            })

            describe('with proper data', () => {
              let result: DbCommunity[] = []
              beforeAll(async () => {
                jest.clearAllMocks()
                await socketEventMocks.data(
                  Buffer.from(
                    JSON.stringify([
                      {
                        api: 'v1_0',
                        url: 'http://localhost:4000/api/v1_0',
                      },
                      {
                        api: 'v2_0',
                        url: 'http://localhost:4000/api/v2_0',
                      },
                    ]),
                  ),
                )
                result = await DbCommunity.find()
              })

              afterAll(async () => {
                await cleanDB()
              })

              it('has two Communty entries in database', () => {
                expect(result).toHaveLength(2)
              })

              it('has an entry for api version v1_0', () => {
                expect(result).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: expect.any(Number),
                      publicKey: expect.any(Buffer),
                      apiVersion: 'v1_0',
                      endPoint: 'http://localhost:4000/api/v1_0',
                      lastAnnouncedAt: expect.any(Date),
                      createdAt: expect.any(Date),
                      updatedAt: null,
                    }),
                  ]),
                )
              })

              it('has an entry for api version v2_0', () => {
                expect(result).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: expect.any(Number),
                      publicKey: expect.any(Buffer),
                      apiVersion: 'v2_0',
                      endPoint: 'http://localhost:4000/api/v2_0',
                      lastAnnouncedAt: expect.any(Date),
                      createdAt: expect.any(Date),
                      updatedAt: null,
                    }),
                  ]),
                )
              })
            })
          })

          describe('on open', () => {
            beforeEach(() => {
              socketEventMocks.open()
            })

            it('calls socket write with own api versions', () => {
              expect(socketWriteMock).toBeCalledWith(
                Buffer.from(
                  JSON.stringify([
                    {
                      api: 'v1_0',
                      url: 'http://localhost:4000/api/v1_0',
                    },
                    {
                      api: 'v1_1',
                      url: 'http://localhost:4000/api/v1_1',
                    },
                    {
                      api: 'v2_0',
                      url: 'http://localhost:4000/api/v2_0',
                    },
                  ]),
                ),
              )
            })
          })
        })
      })
    })
  })
})
