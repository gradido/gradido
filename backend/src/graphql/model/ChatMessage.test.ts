// AI-GENERATED — not an architecture reference
import { ChatMessage } from '@model/ChatMessage'
import { User } from '@model/User'
import { ChatMessageSelect } from 'database'

const HOME = '11111111-1111-4111-8111-111111111111'
const ANNA = { communityUuid: HOME, gradidoId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }
const BEN = { communityUuid: HOME, gradidoId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }

/** A message Anna wrote, as the row stands: her mail wish and a delivery that failed. */
const annasMessage: ChatMessageSelect = {
  id: 7,
  messageUuid: '10000000-0000-4000-8000-000000000007',
  conversationId: 3,
  senderCommunityUuid: ANNA.communityUuid,
  senderGradidoId: ANNA.gradidoId,
  subject: null,
  body: 'Shall we meet at **ten**?',
  notify: 'email',
  mailState: null,
  deliveryState: 'failed',
  lastAttemptAt: new Date('2026-09-23T12:00:05.000Z'),
  delaySeconds: null,
  forwardedFromCommunityUuid: null,
  forwardedFromGradidoId: null,
  createdAt: new Date('2026-09-23T12:00:00.000Z'),
  deletedAt: null,
}

/** The same message delivered, its mail held back: Ben has muted the conversation (E-034). */
const annasMutedMessage: ChatMessageSelect = {
  ...annasMessage,
  deliveryState: 'delivered',
  mailState: 'muted',
}

describe('ChatMessage', () => {
  it('tells the writer how her own message went, and what she asked for', () => {
    expect(new ChatMessage(annasMessage, ANNA)).toMatchObject({
      mine: true,
      deliveryState: 'failed',
      notify: 'email',
      mailState: null,
    })
  })

  // E-034: whether the mail she asked for went out, and if not, that the quiet held it back.
  it('tells the writer what became of the mail she asked for', () => {
    expect(new ChatMessage(annasMutedMessage, ANNA)).toMatchObject({
      mine: true,
      notify: 'email',
      mailState: 'muted',
    })
  })

  // ⛔ E-019, E-024: whether Anna's message reached a server and whether she wanted a mail is
  // hers to know. Ben reads the message, not what she decided about it.
  it('tells the other side none of it', () => {
    expect(new ChatMessage(annasMutedMessage, BEN)).toMatchObject({
      mine: false,
      deliveryState: null,
      notify: null,
      mailState: null,
    })
    const message = new ChatMessage(annasMessage, BEN)
    expect(message).toMatchObject({ mine: false, deliveryState: null, notify: null })
    expect(message.sender).toEqual({ communityUuid: HOME, gradidoID: ANNA.gradidoId })
    expect(message.body).toBe('Shall we meet at **ten**?')
  })

  // E-059: a copy forwarded from another conversation, and who wrote its words first.
  it('says a copy was forwarded, and from whom, where it names somebody', () => {
    const copy: ChatMessageSelect = {
      ...annasMessage,
      forwardedFromCommunityUuid: BEN.communityUuid,
      forwardedFromGradidoId: BEN.gradidoId,
    }
    const ben = { gradidoID: BEN.gradidoId, alias: 'ben' } as unknown as User
    expect(new ChatMessage(copy, BEN, [], null, ben)).toMatchObject({
      forwarded: true,
      forwardedFrom: ben,
    })
    // Where nobody is known by the pair, or a copy names nobody: forwarded all the same.
    expect(new ChatMessage(copy, BEN)).toMatchObject({ forwarded: true, forwardedFrom: null })
  })

  it('says nothing of forwarding for any other message, whatever it is handed', () => {
    const somebody = { gradidoID: BEN.gradidoId } as unknown as User
    expect(new ChatMessage(annasMessage, BEN, [], null, somebody)).toMatchObject({
      forwarded: false,
      forwardedFrom: null,
    })
  })

  it('knows the writer named in capitals as the writer, as the columns compare', () => {
    const shouting = {
      communityUuid: HOME.toUpperCase(),
      gradidoId: ANNA.gradidoId.toUpperCase(),
    }
    expect(new ChatMessage(annasMessage, shouting)).toMatchObject({
      mine: true,
      deliveryState: 'failed',
    })
  })

  // P5: the group sorts the message into the group, never into the thread with its writer, and
  // the writer comes with it for the name and the face.
  it('carries the group and its writer for a message written in a group', () => {
    const anna = new User(null)
    anna.gradidoID = ANNA.gradidoId
    anna.alias = 'anna'
    const groupUuid = '20000000-0000-4000-8000-000000000002'
    const message = new ChatMessage(annasMessage, BEN, [], { groupUuid, senderUser: anna })
    expect(message.groupUuid).toBe(groupUuid)
    expect(message.senderUser).toBe(anna)
    expect(message).toMatchObject({ mine: false, conversationId: 3 })
  })

  it('carries neither in a direct conversation', () => {
    const message = new ChatMessage(annasMessage, BEN)
    expect(message.groupUuid).toBeNull()
    expect(message.senderUser).toBeNull()
  })

  // P5b: an announcement is marked in the thread for every member -- they got the mail, or could
  // have -- while the wish behind a message of two stays the sender's (E-024).
  describe('an announcement', () => {
    const groupUuid = '20000000-0000-4000-8000-000000000002'
    const inGroup = (row: ChatMessageSelect, reader: typeof ANNA) =>
      new ChatMessage(row, reader, [], { groupUuid, senderUser: null })

    it('is one for every member of the group, the writer and the others', () => {
      expect(inGroup(annasMessage, ANNA).announcement).toBe(true)
      expect(inGroup(annasMessage, BEN).announcement).toBe(true)
      // What she asked for stays hers all the same.
      expect(inGroup(annasMessage, BEN).notify).toBeNull()
    })

    it('is none where no mail was asked for', () => {
      const plain = { ...annasMessage, notify: 'none' as const }
      expect(inGroup(plain, ANNA).announcement).toBe(false)
      expect(inGroup(plain, BEN).announcement).toBe(false)
    })

    // ⛔ A mail wished for in a conversation of two is no announcement, and it stays the
    // sender's: Ben reads no mark of it.
    it('is never one in a direct conversation', () => {
      expect(new ChatMessage(annasMessage, BEN).announcement).toBe(false)
      expect(new ChatMessage(annasMessage, ANNA).announcement).toBe(false)
    })
  })
})
