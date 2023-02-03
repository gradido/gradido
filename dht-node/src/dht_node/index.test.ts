/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { startDHT } from './index'
import DHT from '@hyperswarm/dht'
import CONFIG from '@/config'
import { logger } from '@test/testSetup'
import { Community as DbCommunity } from '@entity/Community'
import { testEnvironment, cleanDB } from '@test/helpers'

CONFIG.FEDERATION_DHT_SEED = '64ebcb0e3ad547848fef4197c6e2332f'

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
    foreign: true,
    host: '188.95.53.5',
    port: 63561,
  },
  to: { id: null, foreign: true, host: '83.53.31.27', port: 55723 },
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
  testEnv = await testEnvironment()
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
                  new SyntaxError('Unexpected token \'o\', "no-json string" is not valid JSON'),
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
                  new SyntaxError('Unexpected token \'i\', "invalid ty"... is not valid JSON'),
                )
              })
            })

            describe('with receiving array of string-arrays', () => {
              beforeEach(async () => {
                jest.clearAllMocks()
                const strArray: string[][] = [
                  [`api`, `url`, `invalid type in array test`],
                  [`wrong`, `api`, `url`],
                ]
                await socketEventMocks.data(Buffer.from(strArray.toString()))
              })

              it('logs the received data', () => {
                expect(logger.info).toBeCalledWith(
                  'data: api,url,invalid type in array test,wrong,api,url',
                )
              })

              it('logs an error of unexpected data format and structure', () => {
                expect(logger.error).toBeCalledWith(
                  'Error on receiving data from socket:',
                  new SyntaxError('Unexpected token \'a\', "api,url,in"... is not valid JSON'),
                )
              })
            })

            describe('with receiving JSON-Array with too much entries', () => {
              let jsonArray: { api: string; url: string }[]
              beforeEach(async () => {
                jest.clearAllMocks()
                jsonArray = [
                  { api: '1_0', url: 'too much versions at the same time test' },
                  { api: '1_0', url: 'url2' },
                  { api: '1_0', url: 'url3' },
                  { api: '1_0', url: 'url4' },
                  { api: '1_0', url: 'url5' },
                ]
                await socketEventMocks.data(Buffer.from(JSON.stringify(jsonArray)))
              })

              it('logs the received data', () => {
                expect(logger.info).toBeCalledWith(
                  'data: [{"api":"1_0","url":"too much versions at the same time test"},{"api":"1_0","url":"url2"},{"api":"1_0","url":"url3"},{"api":"1_0","url":"url4"},{"api":"1_0","url":"url5"}]',
                )
              })

              it('logs a warning of too much apiVersion-Definitions', () => {
                expect(logger.warn).toBeCalledWith(
                  `received totaly wrong or too much apiVersions-Definition JSON-String: ${JSON.stringify(
                    jsonArray,
                  )}`,
                )
              })
            })

            describe('with receiving wrong but tolerated property data', () => {
              let jsonArray: any[]
              let result: DbCommunity[] = []
              beforeAll(async () => {
                jest.clearAllMocks()
                jsonArray = [
                  {
                    wrong: 'wrong but tolerated property test',
                    api: '1_0',
                    url: 'url1',
                  },
                  {
                    api: '2_0',
                    url: 'url2',
                    wrong: 'wrong but tolerated property test',
                  },
                ]
                await socketEventMocks.data(Buffer.from(JSON.stringify(jsonArray)))
                result = await DbCommunity.find({ foreign: true })
              })

              afterAll(async () => {
                await cleanDB()
              })

              it('has two Communty entries in database', () => {
                expect(result).toHaveLength(2)
              })

              it('has an entry for api version 1_0', () => {
                expect(result).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: expect.any(Number),
                      foreign: true,
                      publicKey: expect.any(Buffer),
                      apiVersion: '1_0',
                      endPoint: 'url1',
                      lastAnnouncedAt: expect.any(Date),
                      createdAt: expect.any(Date),
                      updatedAt: null,
                    }),
                  ]),
                )
              })

              it('has an entry for api version 2_0', () => {
                expect(result).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: expect.any(Number),
                      foreign: true,
                      publicKey: expect.any(Buffer),
                      apiVersion: '2_0',
                      endPoint: 'url2',
                      lastAnnouncedAt: expect.any(Date),
                      createdAt: expect.any(Date),
                      updatedAt: null,
                    }),
                  ]),
                )
              })
            })

            describe('with receiving data but missing api property', () => {
              let jsonArray: any[]
              beforeEach(async () => {
                jest.clearAllMocks()
                jsonArray = [
                  { test1: 'missing api proterty test', url: 'any url definition as string' },
                  { api: 'some api', test2: 'missing url property test' },
                ]
                await socketEventMocks.data(Buffer.from(JSON.stringify(jsonArray)))
              })

              it('logs the received data', () => {
                expect(logger.info).toBeCalledWith(`data: ${JSON.stringify(jsonArray)}`)
              })

              it('logs a warning of invalid apiVersion-Definition', () => {
                expect(logger.warn).toBeCalledWith(
                  `received invalid apiVersion-Definition: ${JSON.stringify(jsonArray[0])}`,
                )
              })
            })

            describe('with receiving data but missing url property', () => {
              let jsonArray: any[]
              beforeEach(async () => {
                jest.clearAllMocks()
                jsonArray = [
                  { api: 'some api', test2: 'missing url property test' },
                  { test1: 'missing api proterty test', url: 'any url definition as string' },
                ]
                await socketEventMocks.data(Buffer.from(JSON.stringify(jsonArray)))
              })

              it('logs the received data', () => {
                expect(logger.info).toBeCalledWith(`data: ${JSON.stringify(jsonArray)}`)
              })

              it('logs a warning of invalid apiVersion-Definition', () => {
                expect(logger.warn).toBeCalledWith(
                  `received invalid apiVersion-Definition: ${JSON.stringify(jsonArray[0])}`,
                )
              })
            })

            describe('with receiving data but wrong type of api property', () => {
              let jsonArray: any[]
              beforeEach(async () => {
                jest.clearAllMocks()
                jsonArray = [
                  { api: 1, url: 'wrong property type tests' },
                  { api: 'urltyptest', url: 2 },
                  { api: 1, url: 2 },
                ]
                await socketEventMocks.data(Buffer.from(JSON.stringify(jsonArray)))
              })

              it('logs the received data', () => {
                expect(logger.info).toBeCalledWith(`data: ${JSON.stringify(jsonArray)}`)
              })

              it('logs a warning of invalid apiVersion-Definition', () => {
                expect(logger.warn).toBeCalledWith(
                  `received invalid apiVersion-Definition: ${JSON.stringify(jsonArray[0])}`,
                )
              })
            })

            describe('with receiving data but wrong type of url property', () => {
              let jsonArray: any[]
              beforeEach(async () => {
                jest.clearAllMocks()
                jsonArray = [
                  { api: 'urltyptest', url: 2 },
                  { api: 1, url: 'wrong property type tests' },
                  { api: 1, url: 2 },
                ]
                await socketEventMocks.data(Buffer.from(JSON.stringify(jsonArray)))
              })

              it('logs the received data', () => {
                expect(logger.info).toBeCalledWith(`data: ${JSON.stringify(jsonArray)}`)
              })

              it('logs a warning of invalid apiVersion-Definition', () => {
                expect(logger.warn).toBeCalledWith(
                  `received invalid apiVersion-Definition: ${JSON.stringify(jsonArray[0])}`,
                )
              })
            })

            describe('with receiving data but wrong type of both properties', () => {
              let jsonArray: any[]
              beforeEach(async () => {
                jest.clearAllMocks()
                jsonArray = [
                  { api: 1, url: 2 },
                  { api: 'urltyptest', url: 2 },
                  { api: 1, url: 'wrong property type tests' },
                ]
                await socketEventMocks.data(Buffer.from(JSON.stringify(jsonArray)))
              })

              it('logs the received data', () => {
                expect(logger.info).toBeCalledWith(`data: ${JSON.stringify(jsonArray)}`)
              })

              it('logs a warning of invalid apiVersion-Definition', () => {
                expect(logger.warn).toBeCalledWith(
                  `received invalid apiVersion-Definition: ${JSON.stringify(jsonArray[0])}`,
                )
              })
            })

            describe('with receiving data but too long api string', () => {
              let jsonArray: any[]
              beforeEach(async () => {
                jest.clearAllMocks()
                jsonArray = [
                  { api: 'toolong api', url: 'some valid url' },
                  {
                    api: 'valid  api',
                    url: 'this is a too long url definition with exact one character more than the allowed two hundert and fiftyfive characters. and here begins the fill characters with no sense of content menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmic',
                  },
                  {
                    api: 'toolong api',
                    url: 'this is a too long url definition with exact one character more than the allowed two hundert and fiftyfive characters. and here begins the fill characters with no sense of content menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmic',
                  },
                ]
                await socketEventMocks.data(Buffer.from(JSON.stringify(jsonArray)))
              })

              it('logs the received data', () => {
                expect(logger.info).toBeCalledWith(`data: ${JSON.stringify(jsonArray)}`)
              })

              it('logs a warning of invalid apiVersion-Definition', () => {
                expect(logger.warn).toBeCalledWith(
                  `received apiVersion with content longer than max length: ${JSON.stringify(
                    jsonArray[0],
                  )}`,
                )
              })
            })

            describe('with receiving data but too long url string', () => {
              let jsonArray: any[]
              beforeEach(async () => {
                jest.clearAllMocks()
                jsonArray = [
                  {
                    api: 'api',
                    url: 'this is a too long url definition with exact one character more than the allowed two hundert and fiftyfive characters. and here begins the fill characters with no sense of content menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmic',
                  },
                  { api: 'toolong api', url: 'some valid url' },
                  {
                    api: 'toolong api',
                    url: 'this is a too long url definition with exact one character more than the allowed two hundert and fiftyfive characters. and here begins the fill characters with no sense of content menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmic',
                  },
                ]
                await socketEventMocks.data(Buffer.from(JSON.stringify(jsonArray)))
              })

              it('logs the received data', () => {
                expect(logger.info).toBeCalledWith(`data: ${JSON.stringify(jsonArray)}`)
              })

              it('logs a warning of invalid apiVersion-Definition', () => {
                expect(logger.warn).toBeCalledWith(
                  `received apiVersion with content longer than max length: ${JSON.stringify(
                    jsonArray[0],
                  )}`,
                )
              })
            })

            describe('with receiving data but both properties with too long strings', () => {
              let jsonArray: any[]
              beforeEach(async () => {
                jest.clearAllMocks()
                jsonArray = [
                  {
                    api: 'toolong api',
                    url: 'this is a too long url definition with exact one character more than the allowed two hundert and fiftyfive characters. and here begins the fill characters with no sense of content menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmic',
                  },
                  {
                    api: 'api',
                    url: 'this is a too long url definition with exact one character more than the allowed two hundert and fiftyfive characters. and here begins the fill characters with no sense of content menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmic',
                  },
                  { api: 'toolong api', url: 'some valid url' },
                ]
                await socketEventMocks.data(Buffer.from(JSON.stringify(jsonArray)))
              })

              it('logs the received data', () => {
                expect(logger.info).toBeCalledWith(`data: ${JSON.stringify(jsonArray)}`)
              })
            })

            describe('with receiving data of exact max allowed properties length', () => {
              let jsonArray: any[]
              let result: DbCommunity[] = []
              beforeAll(async () => {
                jest.clearAllMocks()
                jsonArray = [
                  {
                    api: 'valid  api',
                    url: 'this is a valid url definition with exact the max allowed length of two hundert and fiftyfive characters. and here begins the fill characters with no sense of content kuhwarmiga menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmich',
                  },
                  {
                    api: 'api',
                    url: 'this is a too long url definition with exact one character more than the allowed two hundert and fiftyfive characters. and here begins the fill characters with no sense of content menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmic',
                  },
                  { api: 'toolong api', url: 'some valid url' },
                ]
                await socketEventMocks.data(Buffer.from(JSON.stringify(jsonArray)))
                result = await DbCommunity.find({ foreign: true })
              })

              afterAll(async () => {
                await cleanDB()
              })

              it('has one Communty entry in database', () => {
                expect(result).toHaveLength(1)
              })

              it(`has an entry with max content length for api and url`, () => {
                expect(result).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: expect.any(Number),
                      foreign: true,
                      publicKey: expect.any(Buffer),
                      apiVersion: 'valid  api',
                      endPoint:
                        'this is a valid url definition with exact the max allowed length of two hundert and fiftyfive characters. and here begins the fill characters with no sense of content kuhwarmiga menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmich',
                      lastAnnouncedAt: expect.any(Date),
                      createdAt: expect.any(Date),
                      updatedAt: null,
                    }),
                  ]),
                )
              })
            })

            describe('with receiving data of exact max allowed buffer length', () => {
              let jsonArray: any[]
              let result: DbCommunity[] = []
              beforeAll(async () => {
                jest.clearAllMocks()
                jsonArray = [
                  {
                    api: 'valid api1',
                    url: 'this is a valid url definition with exact the max allowed length of two hundert and fiftyfive characters. and here begins the fill characters with no sense of content kuhwarmiga menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmich',
                  },
                  {
                    api: 'valid api2',
                    url: 'this is a valid url definition with exact the max allowed length of two hundert and fiftyfive characters. and here begins the fill characters with no sense of content kuhwarmiga menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmich',
                  },
                  {
                    api: 'valid api3',
                    url: 'this is a valid url definition with exact the max allowed length of two hundert and fiftyfive characters. and here begins the fill characters with no sense of content kuhwarmiga menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmich',
                  },
                  {
                    api: 'valid api4',
                    url: 'this is a valid url definition with exact the max allowed length of two hundert and fiftyfive characters. and here begins the fill characters with no sense of content kuhwarmiga menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmich',
                  },
                ]
                await socketEventMocks.data(Buffer.from(JSON.stringify(jsonArray)))
                result = await DbCommunity.find({ foreign: true })
              })

              afterAll(async () => {
                await cleanDB()
              })

              it('has five Communty entries in database', () => {
                expect(result).toHaveLength(4)
              })

              it(`has an entry 'valid api1' with max content length for api and url`, () => {
                expect(result).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: expect.any(Number),
                      foreign: true,
                      publicKey: expect.any(Buffer),
                      apiVersion: 'valid api1',
                      endPoint:
                        'this is a valid url definition with exact the max allowed length of two hundert and fiftyfive characters. and here begins the fill characters with no sense of content kuhwarmiga menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmich',
                      lastAnnouncedAt: expect.any(Date),
                      createdAt: expect.any(Date),
                      updatedAt: null,
                    }),
                  ]),
                )
              })

              it(`has an entry 'valid api2' with max content length for api and url`, () => {
                expect(result).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: expect.any(Number),
                      foreign: true,
                      publicKey: expect.any(Buffer),
                      apiVersion: 'valid api2',
                      endPoint:
                        'this is a valid url definition with exact the max allowed length of two hundert and fiftyfive characters. and here begins the fill characters with no sense of content kuhwarmiga menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmich',
                      lastAnnouncedAt: expect.any(Date),
                      createdAt: expect.any(Date),
                      updatedAt: null,
                    }),
                  ]),
                )
              })

              it(`has an entry 'valid api3' with max content length for api and url`, () => {
                expect(result).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: expect.any(Number),
                      foreign: true,
                      publicKey: expect.any(Buffer),
                      apiVersion: 'valid api3',
                      endPoint:
                        'this is a valid url definition with exact the max allowed length of two hundert and fiftyfive characters. and here begins the fill characters with no sense of content kuhwarmiga menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmich',
                      lastAnnouncedAt: expect.any(Date),
                      createdAt: expect.any(Date),
                      updatedAt: null,
                    }),
                  ]),
                )
              })

              it(`has an entry 'valid api4' with max content length for api and url`, () => {
                expect(result).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: expect.any(Number),
                      foreign: true,
                      publicKey: expect.any(Buffer),
                      apiVersion: 'valid api4',
                      endPoint:
                        'this is a valid url definition with exact the max allowed length of two hundert and fiftyfive characters. and here begins the fill characters with no sense of content kuhwarmiga menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmich',
                      lastAnnouncedAt: expect.any(Date),
                      createdAt: expect.any(Date),
                      updatedAt: null,
                    }),
                  ]),
                )
              })
            })

            describe('with receiving data longer than max allowed buffer length', () => {
              let jsonArray: any[]
              beforeEach(async () => {
                jest.clearAllMocks()
                jsonArray = [
                  {
                    api: 'Xvalid api1',
                    url: 'this is a valid url definition with exact the max allowed length of two hundert and fiftyfive characters. and here begins the fill characters with no sense of content kuhwarmiga menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmich',
                  },
                  {
                    api: 'valid api2',
                    url: 'this is a valid url definition with exact the max allowed length of two hundert and fiftyfive characters. and here begins the fill characters with no sense of content kuhwarmiga menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmich',
                  },
                  {
                    api: 'valid api3',
                    url: 'this is a valid url definition with exact the max allowed length of two hundert and fiftyfive characters. and here begins the fill characters with no sense of content kuhwarmiga menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmich',
                  },
                  {
                    api: 'valid api4',
                    url: 'this is a valid url definition with exact the max allowed length of two hundert and fiftyfive characters. and here begins the fill characters with no sense of content kuhwarmiga menschhabicheinhungerdassichnichtweiswoichheutnachtschlafensollsofriertesmich',
                  },
                ]
                await socketEventMocks.data(Buffer.from(JSON.stringify(jsonArray)))
              })

              it('logs the received data', () => {
                expect(logger.warn).toBeCalledWith(
                  `received more than max allowed length of data buffer: ${
                    JSON.stringify(jsonArray).length
                  } against 1141 max allowed`,
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
                        api: '1_0',
                        url: 'http://localhost:5001/api/',
                      },
                      {
                        api: '2_0',
                        url: 'http://localhost:5002/api/',
                      },
                    ]),
                  ),
                )
                result = await DbCommunity.find({ foreign: true })
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
                      foreign: true,
                      publicKey: expect.any(Buffer),
                      apiVersion: '1_0',
                      endPoint: 'http://localhost:5001/api/',
                      lastAnnouncedAt: expect.any(Date),
                      createdAt: expect.any(Date),
                      updatedAt: null,
                    }),
                  ]),
                )
              })

              it('has an entry for api version 2_0', () => {
                expect(result).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: expect.any(Number),
                      foreign: true,
                      publicKey: expect.any(Buffer),
                      apiVersion: '2_0',
                      endPoint: 'http://localhost:5002/api/',
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

            it.skip('calls socket write with own api versions', () => {
              expect(socketWriteMock).toBeCalledWith(
                Buffer.from(
                  JSON.stringify([
                    {
                      api: '1_0',
                      url: 'http://localhost:5001/api/',
                    },
                    {
                      api: '1_1',
                      url: 'http://localhost:5002/api/',
                    },
                    {
                      api: '2_0',
                      url: 'http://localhost:5003/api/',
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
