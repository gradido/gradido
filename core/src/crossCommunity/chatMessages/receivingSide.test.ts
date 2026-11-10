// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import * as database from 'database'
import * as mails from '../../emails/sendEmailVariants'
import * as chatMessage from '../../logic/ChatMessage.logic'
import * as chatMessageImage from '../../logic/ChatMessageImage.logic'
import { ApiClientCompleted } from '../ApiClient'
import { ChatMessageWire } from '../schema'
import { EDIT_CHAT_MESSAGE_REFUSED, editChatMessage, receiveChatMessage } from './receivingSide'

// ⛔ spyOn, not mock.module: Bun cannot restore a module mock, and a replaced module stays
// replaced for every test file after this one -- sendEmailVariants.test.ts among them.

const SENDER_COMMUNITY = '22222222-2222-4222-8222-222222222222'
const HOME = '11111111-1111-4111-8111-111111111111'
const MESSAGE_UUID = '10000000-0000-4000-8000-000000000001'
const SENDER = {
  id: 7,
  gradidoID: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  communityUuid: SENDER_COMMUNITY,
  alias: 'anna',
} as database.User
const RECIPIENT = {
  gradidoID: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  communityUuid: HOME,
  firstName: 'Ben',
  lastName: 'Near',
  language: 'de',
  emailContact: { email: 'ben@example.org' },
} as database.User
const PICTURE = { imageUuid: '40000000-0000-4000-8000-000000000001', width: 4, height: 2 }
const FILED = { conversationId: 3 } as database.ChatMessageSelect
const senderClient = { communityUuid: SENDER_COMMUNITY } as ApiClientCompleted

const message = (rest: Partial<ChatMessageWire> = {}): ChatMessageWire => ({
  sender: { communityUuid: SENDER_COMMUNITY, gradidoId: SENDER.gradidoID, alias: SENDER.alias },
  recipient: { communityUuid: HOME, gradidoId: RECIPIENT.gradidoID },
  messageUuid: MESSAGE_UUID,
  subject: 'About Saturday',
  body: 'Shall we meet at ten?',
  notify: database.ChatMessageNotify.EMAIL,
  images: [],
  ...rest,
})
const receive = (body: ChatMessageWire = message()) => receiveChatMessage({ body, senderClient })
const statusOf = (answer: unknown) => (answer as { code?: number }).code

let spies: { mockRestore: () => void }[] = []
let findUser: ReturnType<typeof spyOn>
let fileSender: ReturnType<typeof spyOn>
let updateAlias: ReturnType<typeof spyOn>
let accept: ReturnType<typeof spyOn>
let storePicture: ReturnType<typeof spyOn>
let removePictures: ReturnType<typeof spyOn>
let store: ReturnType<typeof spyOn>
let mutedAt: ReturnType<typeof spyOn>
let mail: ReturnType<typeof spyOn>

beforeEach(() => {
  findUser = spyOn(database, 'findUserByUuids').mockImplementation(
    async (_communityUuid: string, gradidoId: string) =>
      gradidoId === SENDER.gradidoID ? { ...SENDER } : RECIPIENT,
  )
  fileSender = spyOn(database, 'dbUpsertForeignUser').mockResolvedValue({
    success: true,
    value: 7,
  } as never)
  updateAlias = spyOn(database, 'dbUpdateForeignUserAlias').mockResolvedValue({
    success: true,
  } as never)
  accept = spyOn(chatMessageImage, 'acceptIncomingChatMessageImages').mockResolvedValue({
    success: true,
    value: [],
  } as never)
  storePicture = spyOn(chatMessageImage, 'storeIncomingChatMessageImage').mockResolvedValue({
    success: true,
    value: 'FILED',
  } as never)
  removePictures = spyOn(chatMessageImage, 'removeChatMessageImages').mockResolvedValue()
  store = spyOn(chatMessage, 'storeChatMessage').mockResolvedValue(FILED)
  mutedAt = spyOn(chatMessage, 'readChatMemberMutedAt').mockResolvedValue(null)
  mail = spyOn(mails, 'sendCustomEmail').mockResolvedValue(true as never)
  spies = [
    findUser,
    fileSender,
    updateAlias,
    accept,
    storePicture,
    removePictures,
    store,
    mutedAt,
    mail,
  ]
})

afterEach(() => {
  for (const spy of spies) {
    spy.mockRestore()
  }
})

const withPicture = () => {
  accept.mockResolvedValue({ success: true, value: [PICTURE] } as never)
}

describe('receiveChatMessage', () => {
  it('files the message under the uuid the sender sent, mails it and answers MAILED', async () => {
    expect(await receive()).toEqual({ mailState: database.ChatMessageMailState.MAILED })
    expect(store).toHaveBeenCalledWith(
      {
        messageUuid: MESSAGE_UUID,
        sender: { communityUuid: SENDER_COMMUNITY, gradidoId: SENDER.gradidoID },
        recipient: { communityUuid: HOME, gradidoId: RECIPIENT.gradidoID },
        subject: 'About Saturday',
        body: 'Shall we meet at ten?',
        notify: 'email',
        deliveryState: 'delivered',
      },
      'incoming',
    )
    expect(mail).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ben@example.org', senderAlias: 'anna', hasImage: false }),
    )
  })

  // FÖD-14: a server sends messages of its own members only
  it('refuses a sender of another community than the calling one', async () => {
    const answer = await receive(message({ sender: { ...message().sender, communityUuid: HOME } }))
    expect(statusOf(answer)).toBe(401)
    expect(store).not.toHaveBeenCalled()
  })

  it('refuses a picture it does not accept, and files nothing', async () => {
    accept.mockResolvedValue({ success: false, error: 'NOT_JPEG' } as never)
    expect(statusOf(await receive())).toBe(400)
    expect(store).not.toHaveBeenCalled()
  })

  it('files a sender it does not know yet, then the message', async () => {
    findUser.mockResolvedValueOnce(null)
    await receive()
    expect(fileSender).toHaveBeenCalledWith(message().sender)
    expect(store).toHaveBeenCalledTimes(1)
  })

  it('answers 404 where the sender cannot be filed', async () => {
    findUser.mockResolvedValueOnce(null)
    fileSender.mockResolvedValue({ success: false, error: new Error('duplicate alias') } as never)
    expect(statusOf(await receive())).toBe(404)
    expect(store).not.toHaveBeenCalled()
  })

  it('brings the alias of a sender on file up to date and mails under it', async () => {
    await receive(message({ sender: { ...message().sender, alias: 'anni' } }))
    expect(updateAlias).toHaveBeenCalledWith(SENDER.id, 'anni')
    expect(mail).toHaveBeenCalledWith(expect.objectContaining({ senderAlias: 'anni' }))
  })

  it('answers 404 for a recipient who is no member here', async () => {
    findUser.mockImplementation(async (_c: string, gradidoId: string) =>
      gradidoId === SENDER.gradidoID ? SENDER : null,
    )
    expect(statusOf(await receive())).toBe(404)
  })

  it('files a message wished without a mail as such, mails nothing and answers null', async () => {
    expect(await receive(message({ notify: database.ChatMessageNotify.NONE }))).toEqual({
      mailState: null,
    })
    expect(store.mock.calls[0][0]).toMatchObject({ notify: 'none' })
    expect(mail).not.toHaveBeenCalled()
  })

  it('answers MUTED for a recipient who muted the conversation, and mails nothing', async () => {
    mutedAt.mockResolvedValue(new Date())
    expect(await receive()).toEqual({ mailState: database.ChatMessageMailState.MUTED })
    expect(mail).not.toHaveBeenCalled()
  })

  it('mails a letter to a recipient who muted the conversation, filed with the wish email', async () => {
    mutedAt.mockResolvedValue(new Date())
    expect(await receive(message({ notify: 'letter' }))).toEqual({
      mailState: database.ChatMessageMailState.MAILED,
    })
    expect(store.mock.calls[0][0]).toMatchObject({ notify: 'email' })
  })

  it('mails a message it could not file, even one wished without a mail', async () => {
    store.mockResolvedValue(null)
    await receive(message({ notify: database.ChatMessageNotify.NONE }))
    expect(mail).toHaveBeenCalledTimes(1)
  })

  it('answers null where the mail did not go out', async () => {
    mail.mockResolvedValue(new Error('smtp down') as never)
    expect(await receive()).toEqual({ mailState: null })
  })

  describe('with a picture', () => {
    beforeEach(withPicture)

    it('files the picture under the message uuid, then the message, and mails that there is one', async () => {
      await receive()
      expect(storePicture).toHaveBeenCalledWith(MESSAGE_UUID, PICTURE)
      expect(storePicture.mock.invocationCallOrder[0]).toBeLessThan(
        store.mock.invocationCallOrder[0],
      )
      expect(mail).toHaveBeenCalledWith(expect.objectContaining({ hasImage: true }))
    })

    it('answers 409 where another picture is filed under the uuid, and files nothing', async () => {
      storePicture.mockResolvedValue({ success: false, error: 'CONTRADICTION' } as never)
      expect(statusOf(await receive())).toBe(409)
      expect(store).not.toHaveBeenCalled()
    })

    it('answers 500 where the picture cannot be filed', async () => {
      storePicture.mockResolvedValue({ success: false, error: 'NOT_STORED' } as never)
      expect(statusOf(await receive())).toBe(500)
      expect(store).not.toHaveBeenCalled()
    })

    it('takes the picture back out where the message cannot be filed, and mails nothing', async () => {
      store.mockResolvedValue(null)
      expect(statusOf(await receive())).toBe(500)
      expect(removePictures).toHaveBeenCalledWith(MESSAGE_UUID)
      expect(mail).not.toHaveBeenCalled()
    })

    it('leaves a picture an earlier delivery filed where the message cannot be filed', async () => {
      storePicture.mockResolvedValue({ success: true, value: 'FILED_BEFORE' } as never)
      store.mockResolvedValue(null)
      expect(statusOf(await receive())).toBe(500)
      expect(removePictures).not.toHaveBeenCalled()
    })
  })
})

describe('editChatMessage', () => {
  const WRITER = { communityUuid: SENDER_COMMUNITY, gradidoId: SENDER.gradidoID }
  const NEW_TEXT = 'Der Hofflohmarkt ist am Samstag ab 10 Uhr.'
  const edit = (rest: Partial<{ writer: typeof WRITER; body: string }> = {}) =>
    editChatMessage({
      body: { writer: WRITER, messageUuid: MESSAGE_UUID, body: NEW_TEXT, ...rest },
      senderClient,
    })
  const reason = (answer: unknown) => (answer as { response?: unknown }).response

  let pictures: ReturnType<typeof spyOn>
  let update: ReturnType<typeof spyOn>

  beforeEach(() => {
    pictures = spyOn(database, 'dbSelectChatMessageImageInfos').mockResolvedValue([])
    update = spyOn(database, 'dbUpdateChatMessageBody').mockResolvedValue({
      success: true,
    } as never)
    spies.push(pictures, update)
  })

  it('files the new text for the writer', async () => {
    expect(await edit()).toBe(true)
    expect(update).toHaveBeenCalledWith(MESSAGE_UUID, WRITER, NEW_TEXT)
  })

  it('refuses a writer of another community than the calling one', async () => {
    const answer = await edit({ writer: { ...WRITER, communityUuid: HOME } })
    expect(statusOf(answer)).toBe(401)
    expect(reason(answer)).toBe(EDIT_CHAT_MESSAGE_REFUSED.NOT_THE_WRITERS_COMMUNITY)
    expect(update).not.toHaveBeenCalled()
  })

  it('refuses to empty a message without a picture', async () => {
    const answer = await edit({ body: '' })
    expect(reason(answer)).toBe(EDIT_CHAT_MESSAGE_REFUSED.EMPTY)
    expect(update).not.toHaveBeenCalled()
  })

  // E-044: the caption of a picture may go
  it('empties the caption of a message with a picture', async () => {
    pictures.mockResolvedValue([{}] as never)
    expect(await edit({ body: '' })).toBe(true)
  })

  it('answers UNKNOWN_MESSAGE where no message of the writer is filed under the uuid', async () => {
    update.mockResolvedValue({ success: false, error: new Error('not found') } as never)
    expect(reason(await edit())).toBe(EDIT_CHAT_MESSAGE_REFUSED.UNKNOWN_MESSAGE)
  })

  it('answers NOT_STORED where the database fails', async () => {
    update.mockRejectedValue(new Error(`UPDATE ... '${NEW_TEXT}'`))
    const answer = await edit()
    expect(statusOf(answer)).toBe(500)
    expect(reason(answer)).toBe(EDIT_CHAT_MESSAGE_REFUSED.NOT_STORED)
  })
})
