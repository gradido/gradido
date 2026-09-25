// AI-GENERATED — not an architecture reference
import { ChatMessage } from '@model/ChatMessage'
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
})
