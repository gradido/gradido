// AI-GENERATED — not an architecture reference
import {
  readChatMemberMutedAt,
  recordChatMessageDelivery,
  recordChatMessageMailState,
  removeChatMessageImages,
  sendCustomEmail,
  storeChatMessage,
  storeChatMessageImages,
  V1_0_CommandClient,
} from 'core'
import { ChatMessageSelect, Community as DbCommunity, User as DbUser } from 'database'
import { CommandJwtPayloadType, createKeyPair, verifyAndDecrypt } from 'shared'
import { deliverChatMessageAcrossBorder, deliverChatMessageLocally } from './chatMessageDelivery'

// What the database would do is mocked here: the helper's own decisions are the subject --
// above all the one no database test can bring about, a row that could not be filed.
// ChatResolver.test.ts and TransactionResolver.test.ts run the same ways against a database.
jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    storeChatMessage: jest.fn(),
    readChatMemberMutedAt: jest.fn(),
    recordChatMessageDelivery: jest.fn(),
    recordChatMessageMailState: jest.fn(),
    sendCustomEmail: jest.fn(),
    storeChatMessageImages: jest.fn(),
    removeChatMessageImages: jest.fn(),
  }
})

const HOME = '11111111-1111-4111-8111-111111111111'
const PEER = '22222222-2222-4222-8222-222222222222'
const ANNA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const BEN = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

const anna = {
  communityUuid: HOME,
  gradidoID: ANNA,
  alias: 'anna',
  firstName: 'Anna',
  lastName: 'Near',
} as unknown as DbUser
const ben = {
  communityUuid: HOME,
  gradidoID: BEN,
  alias: 'ben',
  firstName: 'Ben',
  lastName: 'Near',
  language: 'de',
  emailContact: { email: 'ben@example.org' },
} as unknown as DbUser

const row = (deliveryState: 'delivered' | 'pending'): ChatMessageSelect => ({
  id: 5,
  messageUuid: '10000000-0000-4000-8000-000000000005',
  conversationId: 3,
  senderCommunityUuid: HOME,
  senderGradidoId: ANNA,
  subject: null,
  body: 'Shall we meet at ten?',
  notify: 'email',
  mailState: null,
  deliveryState,
  lastAttemptAt: null,
  delaySeconds: null,
  createdAt: new Date('2026-09-24T12:00:00.000Z'),
  deletedAt: null,
})

const store = storeChatMessage as jest.Mock
const mutedAt = readChatMemberMutedAt as jest.Mock
const record = recordChatMessageDelivery as jest.Mock
const recordMail = recordChatMessageMailState as jest.Mock
const mail = sendCustomEmail as jest.Mock
const storePictures = storeChatMessageImages as jest.Mock
const removePictures = removeChatMessageImages as jest.Mock

/** What the transport reports for a mail that went out -- the mail functions pass it on. */
const SENT = { accepted: ['ben@example.org'], response: '250 2.0.0 Ok: queued' }

beforeEach(() => {
  jest.clearAllMocks()
  mutedAt.mockResolvedValue(null)
  recordMail.mockResolvedValue(true)
  mail.mockResolvedValue(SENT)
  storePictures.mockResolvedValue(true)
  removePictures.mockResolvedValue(undefined)
})

describe('deliverChatMessageLocally', () => {
  /** As the chat calls it: (true, …, false). As the form does: (false, 'email', true). */
  const local = (requireStored: boolean, notify: 'email' | 'none' = 'email', letter = false) =>
    deliverChatMessageLocally({
      senderUser: anna,
      recipientUser: ben,
      subject: null,
      body: 'Shall we meet at ten?',
      notify,
      requireStored,
      letter,
    })

  it('files the message and mails what was asked for to a recipient who did not mute', async () => {
    store.mockResolvedValue(row('delivered'))

    expect(await local(true)).toEqual({ ...row('delivered'), mailState: 'mailed' })

    expect(mutedAt).toHaveBeenCalledWith(3, { communityUuid: HOME, gradidoId: BEN })
    expect(mail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ben@example.org',
        subject: '',
        memo: 'Shall we meet at ten?',
      }),
    )
  })

  it('mails nothing that was not asked for, and nothing to a muted recipient', async () => {
    store.mockResolvedValue(row('delivered'))
    await local(true, 'none')
    mutedAt.mockResolvedValue(new Date())
    await local(true, 'email')

    expect(mail).not.toHaveBeenCalled()
  })

  // ⛔ The chat: the row is the message. Not filed, not sent -- and no mail.
  it('mails nothing where the row that is the message could not be filed', async () => {
    store.mockResolvedValue(null)

    expect(await local(true)).toBeNull()

    expect(mutedAt).not.toHaveBeenCalled()
    expect(mail).not.toHaveBeenCalled()
  })

  // The form: the mail is the message, as it was before the chat.
  it('mails the form message whether its row could be filed or not', async () => {
    store.mockResolvedValue(null)

    expect(await local(false, 'email', true)).toBeNull()

    expect(mail).toHaveBeenCalledTimes(1)
  })

  // E-034, A3: the form writes letters, and a letter is mailed whatever the quiet. The chat
  // message with a tick to the same muted recipient mails nothing (above).
  it('mails a letter to a recipient who muted the conversation', async () => {
    store.mockResolvedValue(row('delivered'))
    mutedAt.mockResolvedValue(new Date())

    await local(false, 'email', true)

    expect(mail).toHaveBeenCalledWith(expect.objectContaining({ email: 'ben@example.org' }))
  })

  it('mails a letter to a recipient who did not mute', async () => {
    store.mockResolvedValue(row('delivered'))

    await local(false, 'email', true)

    expect(mail).toHaveBeenCalledTimes(1)
  })
})

/**
 * E-034, A2: the row says what became of the mail -- decided here, for a recipient of this
 * community -- and the copy handed back says the same.
 */
describe('deliverChatMessageLocally, what became of the mail', () => {
  const local = (notify: 'email' | 'none', letter = false, recipientUser: DbUser = ben) =>
    deliverChatMessageLocally({
      senderUser: anna,
      recipientUser,
      subject: null,
      body: 'Shall we meet at ten?',
      notify,
      requireStored: !letter,
      letter,
    })

  beforeEach(() => {
    store.mockResolvedValue(row('delivered'))
  })

  it('MAILED where it was asked for and the recipient did not mute', async () => {
    expect((await local('email'))?.mailState).toBe('mailed')
    expect(recordMail.mock.calls).toEqual([[5, 'mailed']])
    expect(mail).toHaveBeenCalledTimes(1)
  })

  it('MUTED where it was asked for and the recipient muted the conversation', async () => {
    mutedAt.mockResolvedValue(new Date())

    expect((await local('email'))?.mailState).toBe('muted')
    expect(recordMail.mock.calls).toEqual([[5, 'muted']])
    expect(mail).not.toHaveBeenCalled()
  })

  it('nothing where no mail was asked for', async () => {
    expect((await local('none'))?.mailState).toBeNull()
    expect(recordMail).not.toHaveBeenCalled()
  })

  it('MAILED for a letter, muted or not', async () => {
    mutedAt.mockResolvedValue(new Date())

    expect((await local('email', true))?.mailState).toBe('mailed')
    expect(recordMail.mock.calls).toEqual([[5, 'mailed']])
  })

  // No address, no mail: MAILED would say something that did not happen.
  it('nothing where the recipient has no address to mail to', async () => {
    const withoutAddress = { ...ben, emailContact: null } as unknown as DbUser

    expect((await local('email', false, withoutAddress))?.mailState).toBeNull()
    expect(mail).not.toHaveBeenCalled()
    expect(recordMail).not.toHaveBeenCalled()
  })

  // coderabbit on #3982: MAILED only for a mail that went out -- mail switched off (null), the
  // transport failed (nothing, logged there), or an Error.
  it('nothing where the mail did not go out', async () => {
    for (const failed of [null, undefined, new Error('Connection timeout')]) {
      mail.mockResolvedValue(failed)

      expect((await local('email'))?.mailState).toBeNull()
    }
    expect(mail).toHaveBeenCalledTimes(3)
    expect(recordMail).not.toHaveBeenCalled()
  })

  // What the row says: where the state could not be recorded, the copy says nothing of it.
  it('hands back the row as filed where the state could not be recorded', async () => {
    recordMail.mockResolvedValue(false)

    expect(await local('email')).toEqual(row('delivered'))
    expect(mail).toHaveBeenCalledTimes(1)
  })
})

/**
 * P7: a message with a picture. The picture is filed first, under the uuid the message is filed
 * with after it; a message that could not be filed takes its picture back out. Neither order
 * nor the taking back can be brought about on purpose against a database -- the database tests
 * (ChatResolver.test.ts) run the way through once.
 */
describe('deliverChatMessageLocally with a picture', () => {
  const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9])
  const picture = { image: JPEG, width: 800, height: 600 }

  const withPicture = () =>
    deliverChatMessageLocally({
      senderUser: anna,
      recipientUser: ben,
      subject: null,
      body: '',
      notify: 'email',
      requireStored: true,
      letter: false,
      images: [picture],
    })

  it('files the picture first, under the uuid the message is filed with', async () => {
    const steps: string[] = []
    storePictures.mockImplementation(async () => {
      steps.push('picture')
      return true
    })
    store.mockImplementation(async () => {
      steps.push('message')
      return row('delivered')
    })

    await withPicture()

    expect(steps).toEqual(['picture', 'message'])
    const [pictureUuid, pictures] = storePictures.mock.calls[0]
    expect(store.mock.calls[0][0].messageUuid).toBe(pictureUuid)
    expect(pictures).toEqual([
      { ...picture, imageUuid: expect.stringMatching(/^[0-9a-f-]{36}$/), position: 0 },
    ])
    expect(removePictures).not.toHaveBeenCalled()
  })

  // A new uuid for every message: two messages never share their pictures.
  it('names every message anew', async () => {
    store.mockResolvedValue(row('delivered'))

    await withPicture()
    await withPicture()

    const [first, second] = storePictures.mock.calls.map(([messageUuid]) => messageUuid)
    expect(first).not.toBe(second)
    expect(storePictures.mock.calls[0][1][0].imageUuid).not.toBe(
      storePictures.mock.calls[1][1][0].imageUuid,
    )
  })

  // ⛔ Where the picture could not be filed, nothing is: no message, no mail.
  it('files no message and mails nothing where the picture could not be filed', async () => {
    storePictures.mockResolvedValue(false)
    store.mockResolvedValue(row('delivered'))

    expect(await withPicture()).toBeNull()

    expect(store).not.toHaveBeenCalled()
    expect(mail).not.toHaveBeenCalled()
  })

  // ⛔ A message without its picture would be an empty bubble, a picture without its message is
  // nobody's: the picture goes back out, under the uuid it was filed with.
  it('takes the picture back out where the message could not be filed, and mails nothing', async () => {
    store.mockResolvedValue(null)

    expect(await withPicture()).toBeNull()

    expect(removePictures.mock.calls).toEqual([[storePictures.mock.calls[0][0]]])
    expect(mail).not.toHaveBeenCalled()
  })

  it('files no picture, and takes none back, for a message without one', async () => {
    store.mockResolvedValue(null)

    await deliverChatMessageLocally({
      senderUser: anna,
      recipientUser: ben,
      subject: 'About Sunday',
      body: 'Coffee?',
      notify: 'email',
      requireStored: false,
      letter: true,
    })

    expect(storePictures).not.toHaveBeenCalled()
    expect(removePictures).not.toHaveBeenCalled()
    // The form's mail goes out whatever became of the row, as before.
    expect(mail).toHaveBeenCalledTimes(1)
  })
})

describe('deliverChatMessageAcrossBorder', () => {
  const sendCommandForAnswer = jest.fn()
  const cmdClient = { sendCommandForAnswer } as unknown as V1_0_CommandClient
  let homeKeys: { publicKey: string; privateKey: string }
  let peerKeys: { publicKey: string; privateKey: string }
  let senderCom: DbCommunity
  let receiverCom: DbCommunity

  beforeAll(async () => {
    homeKeys = await createKeyPair()
    peerKeys = await createKeyPair()
    senderCom = {
      privateJwtKey: homeKeys.privateKey,
      publicKey: Buffer.from('home'),
    } as unknown as DbCommunity
    receiverCom = {
      communityUuid: PEER,
      publicJwtKey: peerKeys.publicKey,
    } as unknown as DbCommunity
  })

  const across = (
    requireStored: boolean,
    notify: 'email' | 'none' = 'email',
    senderUser: DbUser = anna,
    letter = false,
  ) =>
    deliverChatMessageAcrossBorder({
      letter,
      senderUser,
      senderCom,
      receiverCom,
      receiverComIdentifier: PEER,
      cmdClient,
      recipientGradidoId: BEN,
      subject: null,
      body: 'Shall we meet at ten?',
      notify,
      requireStored,
    })

  /** What the last command carried, opened with the other community's key as it would be. */
  const payload = async () => {
    const [args] = sendCommandForAnswer.mock.calls[sendCommandForAnswer.mock.calls.length - 1]
    const command = (await verifyAndDecrypt(
      args.handshakeID,
      args.jwt,
      peerKeys.privateKey,
      homeKeys.publicKey,
    )) as CommandJwtPayloadType
    return JSON.parse(command.commandArgs[0])
  }

  it('files the own copy as pending, sends, and hands back the copy as delivered', async () => {
    const moment = new Date('2026-09-24T12:00:01.000Z')
    store.mockResolvedValue(row('pending'))
    sendCommandForAnswer.mockResolvedValue({ success: true, value: null })
    record.mockResolvedValue(moment)

    const { stored, error } = await across(true)

    expect(store.mock.calls[0][0]).toMatchObject({ deliveryState: 'pending', notify: 'email' })
    expect(record).toHaveBeenCalledWith(5, 'delivered', null)
    expect(stored).toEqual({
      ...row('pending'),
      deliveryState: 'delivered',
      lastAttemptAt: moment,
      mailState: null,
    })
    expect(error).toBeNull()
    expect((await payload()).messageUuid).toBe(store.mock.calls[0][0].messageUuid)
  })

  it('hands back the copy as failed, with the answer of the other side, and throws nothing', async () => {
    store.mockResolvedValue(row('pending'))
    sendCommandForAnswer.mockResolvedValue({
      success: false,
      error: 'sendCommand failed with response error: nope',
    })
    record.mockResolvedValue(new Date())

    const { stored, error } = await across(true)

    expect(stored?.deliveryState).toBe('failed')
    expect(error).toBe('sendCommand failed with response error: nope')
  })

  // What the row says: where the state could not be recorded, the copy stays as it was filed.
  it('hands back the copy as filed where its state could not be recorded', async () => {
    store.mockResolvedValue(row('pending'))
    sendCommandForAnswer.mockResolvedValue({ success: true, value: null })
    record.mockResolvedValue(null)

    expect((await across(true)).stored).toEqual(row('pending'))
  })

  // ⛔ The chat: what could not be filed was not sent.
  it('sends nothing where the own copy that is the message could not be filed', async () => {
    store.mockResolvedValue(null)

    expect(await across(true)).toEqual({ stored: null, error: null })

    expect(sendCommandForAnswer).not.toHaveBeenCalled()
  })

  it('sends the form message whether its copy could be filed or not', async () => {
    store.mockResolvedValue(null)
    sendCommandForAnswer.mockResolvedValue({ success: true, value: null })

    expect(await across(false, 'email', anna, true)).toEqual({ stored: null, error: null })

    expect(sendCommandForAnswer).toHaveBeenCalledTimes(1)
  })

  // Only a wish for no mail travels: without the field every server mails, the old ones too.
  it("carries notify in the command only where it is 'none'", async () => {
    store.mockResolvedValue(row('pending'))
    sendCommandForAnswer.mockResolvedValue({ success: true, value: null })

    await across(true, 'email')
    expect(await payload()).not.toHaveProperty('notify')

    await across(true, 'none')
    expect((await payload()).notify).toBe('none')
  })

  // E-034, A3: the receiving server mails a letter whatever the quiet -- it has to know it is one.
  it("carries notify 'letter' in the command of the form, and files the copy as a wish for a mail", async () => {
    store.mockResolvedValue(row('pending'))
    sendCommandForAnswer.mockResolvedValue({ success: true, value: null })

    await across(false, 'email', anna, true)

    expect((await payload()).notify).toBe('letter')
    expect(store.mock.calls[0][0]).toMatchObject({ notify: 'email' })
  })

  // E-034: the receiving server files a sender it does not know with the alias -- and with
  // nothing more, as the receiving side of a transfer does. No first or last name travels.
  it('carries the sender alias in the command, no field without one, and no names', async () => {
    store.mockResolvedValue(row('pending'))
    sendCommandForAnswer.mockResolvedValue({ success: true, value: null })
    const fields = [
      'mailType',
      'memo',
      'messageUuid',
      'receiverComUuid',
      'receiverGradidoId',
      'senderComUuid',
      'senderGradidoId',
      'subject',
    ]

    await across(true)
    const withAlias = await payload()
    expect(withAlias.senderAlias).toBe('anna')
    expect(Object.keys(withAlias).sort()).toEqual([...fields, 'senderAlias'].sort())

    await across(true, 'email', { ...anna, alias: null } as unknown as DbUser)
    expect(Object.keys(await payload()).sort()).toEqual(fields)
  })

  /**
   * E-034, A2: the recipient's server answers what became of the mail, and the own copy notes
   * it with the delivery. RECEIVED -- no mail asked for, or a server from before P3c, which
   * answers it to every message -- and anything unknown note nothing.
   */
  it('notes the answer of the other server on the own copy', async () => {
    const moment = new Date('2026-09-24T12:00:01.000Z')
    store.mockResolvedValue(row('pending'))
    record.mockResolvedValue(moment)

    for (const [answer, noted] of [
      ['mailed', 'mailed'],
      ['muted', 'muted'],
      ['received', null],
      ['something new', null],
      [null, null],
    ] as [string | null, string | null][]) {
      record.mockClear()
      sendCommandForAnswer.mockResolvedValue({ success: true, value: answer })

      const { stored, error } = await across(true)

      expect(record.mock.calls).toEqual([[5, 'delivered', noted]])
      expect(stored).toMatchObject({ deliveryState: 'delivered', mailState: noted })
      expect(error).toBeNull()
    }
  })

  it('notes nothing of a mail where the delivery failed', async () => {
    store.mockResolvedValue(row('pending'))
    record.mockResolvedValue(new Date())
    sendCommandForAnswer.mockResolvedValue({ success: false, error: 'Recipient user not found' })

    const { stored } = await across(true)

    expect(record.mock.calls).toEqual([[5, 'failed', null]])
    expect(stored).toMatchObject({ deliveryState: 'failed', mailState: null })
  })
})
