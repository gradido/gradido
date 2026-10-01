// AI-GENERATED — not an architecture reference
import {
  CommandClientFactory,
  EDIT_CHAT_MESSAGE_COMMAND_ANSWER,
  EditChatMessageCommand,
  V1_0_CommandClient,
} from 'core'
import {
  Community as DbCommunity,
  FederatedCommunity as DbFederatedCommunity,
  getCommunityByUuid,
  getCommunityWithFederatedCommunityByIdentifier,
} from 'database'
import { CommandJwtPayloadType, createKeyPair, verifyAndDecrypt } from 'shared'
import { carryChatMessageEditAcrossBorder } from './chatMessageEdit'

// What the database knows of the two communities is mocked here, and the other server is a
// client whose answer each test says: the subject is what this function seals, whom it asks, and
// what it takes for a change over there.
jest.mock('database', () => {
  const originalModule = jest.requireActual('database')
  return {
    __esModule: true,
    ...originalModule,
    getCommunityByUuid: jest.fn(),
    getCommunityWithFederatedCommunityByIdentifier: jest.fn(),
  }
})

const HOME = '11111111-1111-4111-8111-111111111111'
const PEER = '22222222-2222-4222-8222-222222222222'
const ANNA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const MESSAGE = '40000000-0000-4000-8000-000000000001'
const NEW_TEXT = 'Der Hofflohmarkt ist am Samstag ab 10 Uhr.'
const HOME_KEY = Buffer.alloc(32, 7)

const homeCom = getCommunityByUuid as jest.Mock
const peerCom = getCommunityWithFederatedCommunityByIdentifier as jest.Mock

const entry = (apiVersion: string) =>
  ({
    id: apiVersion === '1_0' ? 21 : 22,
    apiVersion,
    endPoint: 'http://chat-peer.invalid/api/',
  }) as unknown as DbFederatedCommunity

let homeKeys: { publicKey: string; privateKey: string }
let peerKeys: { publicKey: string; privateKey: string }
let client: V1_0_CommandClient
let sendCommandForAnswer: jest.SpyInstance
let clientOf: jest.SpyInstance

const carry = () =>
  carryChatMessageEditAcrossBorder({
    writer: { communityUuid: HOME, gradidoId: ANNA },
    otherCommunityUuid: PEER,
    messageUuid: MESSAGE,
    body: NEW_TEXT,
  })

/** The command that went out, opened with the other community's key as it would be there. */
const sent = async () => {
  const [args] = sendCommandForAnswer.mock.calls[sendCommandForAnswer.mock.calls.length - 1]
  const command = (await verifyAndDecrypt(
    args.handshakeID,
    args.jwt,
    peerKeys.privateKey,
    homeKeys.publicKey,
  )) as CommandJwtPayloadType
  return { args, command }
}

beforeAll(async () => {
  homeKeys = await createKeyPair()
  peerKeys = await createKeyPair()
  client = new V1_0_CommandClient(entry('1_0'))
})

beforeEach(() => {
  jest.clearAllMocks()
  homeCom.mockResolvedValue({
    communityUuid: HOME,
    publicKey: HOME_KEY,
    privateJwtKey: homeKeys.privateKey,
  } as unknown as DbCommunity)
  peerCom.mockResolvedValue({
    communityUuid: PEER,
    publicJwtKey: peerKeys.publicKey,
    federatedCommunities: [entry('1_1'), entry('1_0')],
  } as unknown as DbCommunity)
  sendCommandForAnswer = jest
    .spyOn(client, 'sendCommandForAnswer')
    .mockResolvedValue({ success: true, value: EDIT_CHAT_MESSAGE_COMMAND_ANSWER })
  clientOf = jest.spyOn(CommandClientFactory, 'getInstance').mockReturnValue(client)
})

afterEach(() => {
  sendCommandForAnswer.mockRestore()
  clientOf.mockRestore()
})

describe('carryChatMessageEditAcrossBorder (E-060)', () => {
  it('seals a command of its own for the other community: the writer, the message, the text', async () => {
    expect(await carry()).toEqual({ success: true })

    expect(homeCom).toHaveBeenCalledWith(HOME)
    expect(peerCom).toHaveBeenCalledWith(PEER)
    // The V1_0 entry of the other community, whatever else it offers.
    expect(clientOf).toHaveBeenCalledWith(expect.objectContaining({ apiVersion: '1_0' }))
    expect(sendCommandForAnswer).toHaveBeenCalledTimes(1)
    const { args, command } = await sent()
    // The key the other server finds this community by, and checks the writer's community against.
    expect(args.publicKey).toBe(HOME_KEY.toString('hex'))
    expect(command.handshakeID).toBe(args.handshakeID)
    expect(command.commandName).toBe('EDIT_CHAT_MESSAGE_COMMAND')
    expect(command.commandName).toBe(EditChatMessageCommand.EDIT_CHAT_MESSAGE_COMMAND)
    expect(command.commandArgs).toHaveLength(1)
    expect(JSON.parse(command.commandArgs[0])).toEqual({
      senderComUuid: HOME,
      senderGradidoId: ANNA,
      messageUuid: MESSAGE,
      body: NEW_TEXT,
    })
  })

  // ⛔ "No error" is not "changed": only the one word the command answers where it changed its
  // copy lets this server change its own.
  it('takes nothing but the word of the command for a change over there', async () => {
    for (const value of [null, '', 'received', 'mailed', 'true', 'Edited']) {
      sendCommandForAnswer.mockResolvedValue({ success: true, value })
      expect(await carry()).toEqual({
        success: false,
        error: { reason: 'NOT_CONFIRMED', detail: `answered ${JSON.stringify(value)}` },
      })
    }
  })

  it('hands on what the other server said where it did not change its copy', async () => {
    // A server from before the command.
    const older =
      'sendCommand failed with response error: Command EDIT_CHAT_MESSAGE_COMMAND not found'
    // One that did not answer at all.
    const away = 'request to http://chat-peer.invalid/api/1_0/ failed, reason: connect ECONNREFUSED'
    for (const error of [older, away, 'CHAT_MESSAGE_NOT_EDITED: UNKNOWN_MESSAGE']) {
      sendCommandForAnswer.mockResolvedValue({ success: false, error })
      expect(await carry()).toEqual({
        success: false,
        error: { reason: 'NOT_CONFIRMED', detail: error },
      })
    }
  })

  describe('finds no way to deliver, and sends nothing,', () => {
    const noWay = async () => {
      expect(await carry()).toEqual({
        success: false,
        error: { reason: 'NO_WAY_TO_DELIVER', detail: PEER },
      })
      expect(sendCommandForAnswer).not.toHaveBeenCalled()
    }

    it('without a key of its own to seal with', async () => {
      homeCom.mockResolvedValue({ communityUuid: HOME, publicKey: HOME_KEY, privateJwtKey: null })
      await noWay()
    })

    it('without its own community on file', async () => {
      homeCom.mockResolvedValue(null)
      await noWay()
    })

    it('without the key of the other community', async () => {
      peerCom.mockResolvedValue({
        communityUuid: PEER,
        publicJwtKey: null,
        federatedCommunities: [entry('1_0')],
      })
      await noWay()
    })

    it('for a community not known here', async () => {
      peerCom.mockResolvedValue(null)
      await noWay()
    })

    it('for a community that offers no V1_0 entry', async () => {
      peerCom.mockResolvedValue({
        communityUuid: PEER,
        publicJwtKey: peerKeys.publicKey,
        federatedCommunities: [entry('1_1')],
      })
      await noWay()
      expect(clientOf).not.toHaveBeenCalled()
    })

    it('where there is no client for the entry', async () => {
      clientOf.mockReturnValue(null)
      await noWay()
    })
  })
})
