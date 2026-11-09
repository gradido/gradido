// AI-GENERATED — not an architecture reference

import {
  ApiClientCache,
  ChatMessageImageAccepted,
  ChatMessageWireInput,
  chatMailWentOut,
  chatMessageAnswerSchema,
  chatMessageMailState,
  chatMessageWireSchema,
  readChatMemberMutedAt,
  recordChatMessageDelivery,
  recordChatMessageMailState,
  removeChatMessageImages,
  sealedRequestFits,
  sendCustomEmail,
  storeChatMessage,
  storeChatMessageImages,
} from 'core'
import {
  ChatMemberRef,
  ChatMessageDeliveryState,
  ChatMessageMailState,
  ChatMessageNotify,
  ChatMessageSelect,
  CommunitiesSelect,
  User as DbUser,
} from 'database'
import { uuidv4Schema } from 'shared'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { LogError } from '@/server/LogError'

/*
 * The two ways a message between two members leaves this server, shared by the form "send an
 * e-mail" (TransactionResolver.sendEmail) and the chat (ChatResolver.sendChatMessage), so that
 * both file it, mail it and send it the same way. The wish comes in decided -- the
 * wake-up rule (chatMessageNotify) is the caller's. Whether it becomes a mail is decided here
 * for a recipient of this community, and by the recipient's server for one of another
 * (core receiveChatMessage).
 *
 * What differs between the two callers is what the message IS, and `requireStored` says which:
 * - for the form it is the mail -- all there was before the chat; the row is an extra (P1), and
 *   a row that could not be filed changes nothing about the mail or the request;
 * - for the chat it is the row: what could not be filed was not sent, and no mail goes out.
 *
 * And whether the recipient's quiet applies, which `letter` says: the form writes letters, and a
 * letter is mailed whatever the quiet (E-034, A3); the quiet is about chat messages (E-024).
 *
 * Neither function writes the subject or the text into a log.
 */

export interface ChatMessageLocalDelivery {
  senderUser: DbUser
  recipientUser: DbUser
  subject: string | null
  body: string
  /** The sender's wish after the wake-up rule (chatMessageNotify); the form always mails. */
  notify: ChatMessageNotify
  /** True where the row is the message (the chat), false where the mail is (the form). */
  requireStored: boolean
  /** True for the form: a letter, mailed whatever the recipient's quiet (E-034, A3). */
  letter: boolean
  /**
   * The pictures of a chat message (P7), checked already (acceptChatMessageImage) -- one at most
   * today. Only with `requireStored`: a picture is part of the row that is the message. None for
   * the form.
   */
  images?: ChatMessageImageAccepted[]
  /** A copy the sender forwards (E-059): who wrote it first, and what goes with it in the mail. */
  forwarded?: ChatMessageForwarded | null
  /** The message of their conversation the message answers, checked by the caller. */
  replyToMessageUuid?: string | null
}

/**
 * What a forwarded copy carries (E-059): the first writer's pair, filed with the copy; the name
 * the mail gives them -- null where the sender forwards words of their own --; and the sender's
 * words to go with it, which the conversation gets as a message of their own and the mail under
 * the copy.
 */
export interface ChatMessageForwarded {
  from: ChatMemberRef
  fromAlias: string | null
  words: string | null
}

/**
 * Files a message between two members of this community -- one row, which both of them read --
 * and mails it when that is wanted: a letter always, a chat message when asked for and not
 * muted by the recipient (E-024, E-034). The mail is waited for, as every other mail of this
 * server is: what the row says about it has to be what happened.
 *
 * Hands back the row, or null where it could not be filed. The chat's message was not sent then,
 * and nothing is mailed; the form's mail goes out regardless. The row says what became of the
 * mail (E-034, `mail_state`): MAILED where one went out, MUTED where one was asked for and the
 * recipient muted the conversation, nothing where none was asked for -- or where none went out:
 * the recipient has no address, mail is switched off, or the transport failed.
 *
 * ⛔ A message with pictures (P7): the pictures first, under the message's uuid, then the
 * message. Where the pictures could not be filed, nothing is filed and nothing mailed; where the
 * message could not be filed, its pictures are taken back out. A picture without its message is
 * seen by nobody -- it is handed out only with its message --, a message without its picture
 * would be an empty bubble. Both tables are Drizzle's, and nothing in the house runs a Drizzle
 * transaction yet: this order stands in for one.
 */
export async function deliverChatMessageLocally({
  senderUser,
  recipientUser,
  subject,
  body,
  notify,
  requireStored,
  letter,
  images = [],
  forwarded = null,
  replyToMessageUuid = null,
}: ChatMessageLocalDelivery): Promise<ChatMessageSelect | null> {
  const recipient = {
    communityUuid: recipientUser.communityUuid,
    gradidoId: recipientUser.gradidoID,
  }
  // The pictures are filed under it before the message is.
  const messageUuid = uuidv4()
  if (
    images.length > 0 &&
    !(await storeChatMessageImages(
      messageUuid,
      images.map((picture, position) => ({ ...picture, imageUuid: uuidv4(), position })),
    ))
  ) {
    return null
  }
  const stored = await storeChatMessage(
    {
      messageUuid,
      sender: { communityUuid: senderUser.communityUuid, gradidoId: senderUser.gradidoID },
      recipient,
      subject,
      body,
      notify,
      deliveryState: ChatMessageDeliveryState.DELIVERED,
      forwardedFrom: forwarded?.from ?? null,
      replyToMessageUuid,
    },
    'local',
  )
  if (!stored && images.length > 0) {
    await removeChatMessageImages(messageUuid)
  }
  if (!stored && requireStored) {
    return null
  }
  // Without a row there is no conversation, and no mark to read: the form's mail goes out.
  const mutedAt = stored ? await readChatMemberMutedAt(stored.conversationId, recipient) : null
  const decided = chatMessageMailState(notify, mutedAt, letter)
  // A mail is only MAILED where one goes out: without an address, none does.
  let mailState =
    decided === ChatMessageMailState.MAILED && !recipientUser.emailContact ? null : decided
  if (mailState === ChatMessageMailState.MAILED && recipientUser.emailContact) {
    const sent = await sendCustomEmail({
      firstName: recipientUser.firstName,
      lastName: recipientUser.lastName,
      email: recipientUser.emailContact.email,
      language: recipientUser.language,
      senderAlias: senderUser.alias,
      subject: subject ?? '',
      memo: body,
      senderUuid: senderUser.gradidoID,
      senderCommunityUuid: senderUser.communityUuid,
      // The mail says there is a picture, and shows none (MAIL-008).
      hasImage: images.length > 0,
      forwarded: forwarded !== null,
      forwardedFromAlias: forwarded?.fromAlias ?? null,
      forwardWords: forwarded?.words ?? null,
    })
    // Nor where the transport did not take it (coderabbit on #3982).
    if (!chatMailWentOut(sent)) {
      mailState = null
    }
  }
  if (!stored || mailState === null) {
    return stored
  }
  // What the row says now: the state where it was recorded, the row as filed where not.
  return (await recordChatMessageMailState(stored.id, mailState))
    ? { ...stored, mailState }
    : stored
}

export interface ChatMessageBorderDelivery {
  senderUser: DbUser
  /** The recipient's community, authenticated: the request goes there, and its uuid files the copy. */
  receiverCom: CommunitiesSelect
  recipientGradidoId: string
  subject: string | null
  body: string
  /** The sender's wish after the wake-up rule (chatMessageNotify); the form always mails. */
  notify: ChatMessageNotify
  /** True where the row is the message (the chat), false where the mail is (the form). */
  requireStored: boolean
  /** True for the form: a letter, which the recipient's server mails whatever the quiet. */
  letter: boolean
  /**
   * The pictures of a chat message (P7b), checked already (acceptChatMessageImage) -- one at most
   * today. They travel with the message, and the recipient's server checks and files them as this
   * one does. Only with `requireStored`: a picture is part of the row that is the message. None
   * for the form.
   */
  images?: ChatMessageImageAccepted[]
  /**
   * The message of their conversation the message answers, checked by the caller. Filed with
   * this server's own copy only: the request does not carry it yet, and the other server files
   * an ordinary message.
   */
  replyToMessageUuid?: string | null
}

/**
 * Sends a message to a member of another community over the peer api (chatMessage), and files
 * this server's own copy of it: as not yet delivered right before the request goes out (E-019:
 * written first, then delivered), and as delivered or failed with the answer. The recipient's
 * server decides about the mail, with its own mute mark (core receiveChatMessage).
 *
 * ⛔ The request is measured before anything is filed or sent, against what the federation
 * service takes (FEDERATION_REQUEST_MAX_BYTES). Every text fits beside the largest picture
 * (CHAT_IMAGE_MAX_BYTES in shared), so this is a backstop should a limit grow: such a message is
 * refused, TOO_LARGE_ACROSS_BORDER, rather than filed as sent and answered with a bare 413.
 *
 * A message with pictures (P7b): the pictures first, under the message's uuid and under the
 * names the request gives them, then the own copy -- as deliverChatMessageLocally does. Where the
 * pictures could not be filed, nothing is filed and nothing sent; where the own copy could not
 * be, its pictures are taken back out. A delivery that fails leaves the copy with its pictures,
 * FAILED, as any other message (E-019).
 *
 * Hands back the own copy with the state it has now, or null where none was filed, and the
 * error the other community answered with, or null. The copy says what the other server answered
 * became of the mail (E-034, `mail_state`): MAILED or MUTED, nothing where it answered neither.
 * A failed delivery is not thrown: what to make of it is the caller's. Throws only where the
 * message would be too large -- before anything is filed or sent.
 */
export async function deliverChatMessageAcrossBorder({
  senderUser,
  receiverCom,
  recipientGradidoId,
  subject,
  body,
  notify,
  requireStored,
  letter,
  images = [],
  replyToMessageUuid = null,
}: ChatMessageBorderDelivery): Promise<{ stored: ChatMessageSelect | null; error: string | null }> {
  // The other server finds its member by the gradido id alone, as it always did.
  if (!v.safeParse(uuidv4Schema, recipientGradidoId).success) {
    return { stored: null, error: 'Recipient user not found' }
  }
  const recipient = { communityUuid: receiverCom.communityUuid, gradidoId: recipientGradidoId }
  // The id both copies are filed under, and the names of the pictures: chosen before anything is
  // measured, filed or sent.
  const messageUuid = uuidv4()
  const pictures = images.map((picture, position) => ({
    ...picture,
    imageUuid: uuidv4(),
    position,
  }))
  // Parsed here, not first in the client: a message the request would refuse is not filed as sent.
  const message = v.parse(chatMessageWireSchema, {
    sender: {
      communityUuid: senderUser.communityUuid,
      gradidoId: senderUser.gradidoID,
      // what the receiving server files a sender it does not know yet with (E-034)
      alias: senderUser.alias,
    },
    recipient,
    messageUuid,
    subject,
    body,
    notify: letter ? 'letter' : notify,
    // P7b: as base64 -- as the wallet uploads them
    images: pictures.map(({ imageUuid, width, height, image }) => ({
      imageUuid,
      width,
      height,
      data: image.toString('base64'),
    })),
  } satisfies ChatMessageWireInput)
  if (!sealedRequestFits(message)) {
    throw new LogError('CHAT_MESSAGE_NOT_SENT: TOO_LARGE_ACROSS_BORDER', messageUuid)
  }

  if (pictures.length > 0 && !(await storeChatMessageImages(messageUuid, pictures))) {
    return { stored: null, error: null }
  }
  const ownCopy = await storeChatMessage(
    {
      messageUuid,
      sender: { communityUuid: senderUser.communityUuid, gradidoId: senderUser.gradidoID },
      recipient,
      subject,
      body,
      notify,
      deliveryState: ChatMessageDeliveryState.PENDING,
      replyToMessageUuid,
    },
    'outgoing',
  )
  if (!ownCopy && pictures.length > 0) {
    await removeChatMessageImages(messageUuid)
  }
  if (!ownCopy && requireStored) {
    return { stored: null, error: null }
  }
  const { data, error } = await ApiClientCache.getInstance().get(receiverCom).chatMessage(message)
  const failure = error ? `${error.status}: ${String(error.value)}` : null
  if (!ownCopy) {
    return { stored: null, error: failure }
  }
  const deliveryState = error ? ChatMessageDeliveryState.FAILED : ChatMessageDeliveryState.DELIVERED
  // what the other server answered became of the mail: nothing where the answer says neither
  const answer = v.safeParse(chatMessageAnswerSchema, data)
  const mailState = answer.success ? answer.output.mailState : null
  const recordedAt = await recordChatMessageDelivery(ownCopy.id, deliveryState, mailState)
  // What the row says now: the new state where it was recorded, the copy as filed where not.
  return {
    stored: recordedAt
      ? { ...ownCopy, deliveryState, lastAttemptAt: recordedAt, mailState }
      : ownCopy,
    error: failure,
  }
}
