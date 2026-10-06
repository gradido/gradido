// AI-GENERATED — not an architecture reference

import {
  CHAT_MESSAGE_NOTIFY_LETTER,
  ChatMessageImageAccepted,
  chatMailWentOut,
  chatMessageMailState,
  chatMessageMailStateOfAnswer,
  commandRequestBytes,
  commandRequestFits,
  EncryptedTransferArgs,
  readChatMemberMutedAt,
  recordChatMessageDelivery,
  recordChatMessageMailState,
  removeChatMessageImages,
  SendEmailCommand,
  SendEmailCommandParams,
  sendCustomEmail,
  storeChatMessage,
  storeChatMessageImages,
  V1_0_CommandClient,
} from 'core'
import {
  ChatMemberRef,
  ChatMessageDeliveryState,
  ChatMessageMailState,
  ChatMessageNotify,
  ChatMessageSelect,
  Community as DbCommunity,
  User as DbUser,
} from 'database'
import { CommandJwtPayloadType, encryptAndSign, uuidv4Schema } from 'shared'
import { randombytes_random } from 'sodium-native'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { PublishNameLogic } from '@/data/PublishName.logic'
import { LogError } from '@/server/LogError'

/*
 * The two ways a message between two members leaves this server, shared by the form "send an
 * e-mail" (TransactionResolver.sendEmail) and the chat (ChatResolver.sendChatMessage), so that
 * both file it, mail it and build its command the same way. The wish comes in decided -- the
 * wake-up rule (chatMessageNotify) is the caller's. Whether it becomes a mail is decided here
 * for a recipient of this community, and by the recipient's server for one of another
 * (SendEmailCommand).
 *
 * What differs between the two callers is what the message IS, and `requireStored` says which:
 * - for the form it is the mail -- all there was before the chat; the row is an extra (P1), and
 *   a row that could not be filed changes nothing about the mail or the command;
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
      senderAlias: new PublishNameLogic(senderUser).getPublicAlias(),
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
  /** This community: its keys seal the command. */
  senderCom: DbCommunity
  /** The recipient's community: its key opens the command, and its uuid files the own copy. */
  receiverCom: DbCommunity
  /** What the command names the recipient's community by -- as the caller was given it. */
  receiverComIdentifier: string
  cmdClient: V1_0_CommandClient
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
   * today. They travel in the command, and the recipient's server checks and files them as this
   * one does. Only with `requireStored`: a picture is part of the row that is the message. None
   * for the form.
   */
  images?: ChatMessageImageAccepted[]
}

/**
 * Sends a message to a member of another community as a command, and files this server's own
 * copy of it: as not yet delivered right before the command goes out (E-019: written first,
 * then delivered), and as delivered or failed with the answer. The recipient's server decides
 * about the mail, with its own mute mark (SendEmailCommand).
 *
 * The own copy is filed after the command is sealed -- a missing key leaves no row waiting for
 * a delivery that never starts -- and only for a recipient named by gradido id in a community
 * with a uuid: the receiving server looks the recipient up by nothing else.
 *
 * ⛔ The sealed command is measured before anything is filed or sent. The federation module takes
 * a request of 100 KB at most, and a picture comes close to it: the wallet's picture with an
 * ordinary text fits (CHAT_IMAGE_MAX_BYTES says by how much), with a text made up to be heavy it
 * does not -- MaxLength counts characters, the envelope weighs bytes. Such a message is refused,
 * TOO_LARGE_ACROSS_BORDER, rather than filed as sent and then refused by the other server with a
 * bare 413.
 *
 * A message with pictures (P7b): the pictures first, under the message's uuid and under the
 * names the command gives them, then the own copy -- as deliverChatMessageLocally does. Where the
 * pictures could not be filed, nothing is filed and nothing sent; where the own copy could not
 * be, its pictures are taken back out. A delivery that fails leaves the copy with its pictures,
 * FAILED, as any other message (E-019).
 *
 * Hands back the own copy with the state it has now, or null where none was filed, and the
 * error the other community answered with, or null. The copy says what the other server answered
 * became of the mail (E-034, `mail_state`): MAILED or MUTED, nothing where it answered neither --
 * no mail asked for, a server from before P3c, a failed delivery. A failed delivery is not
 * thrown: what to make of it is the caller's. Throws only where the command cannot be sealed, or
 * would be too large -- before anything is filed or sent.
 */
export async function deliverChatMessageAcrossBorder({
  senderUser,
  senderCom,
  receiverCom,
  receiverComIdentifier,
  cmdClient,
  recipientGradidoId,
  subject,
  body,
  notify,
  requireStored,
  letter,
  images = [],
}: ChatMessageBorderDelivery): Promise<{ stored: ChatMessageSelect | null; error: string | null }> {
  // The id both copies are filed under: this server's below, the receiving server's from the
  // payload. The same for the pictures: named before the command is sealed.
  const messageUuid = uuidv4()
  const pictures = images.map((picture, position) => ({
    ...picture,
    imageUuid: uuidv4(),
    position,
  }))
  const handshakeID = randombytes_random().toString()
  const params: SendEmailCommandParams = {
    mailType: 'sendCustomEmail',
    senderComUuid: senderUser.communityUuid,
    senderGradidoId: senderUser.gradidoID,
    receiverComUuid: receiverComIdentifier,
    receiverGradidoId: recipientGradidoId,
    subject: subject ?? '',
    memo: body,
    messageUuid,
    // What the receiving server files a sender it does not know yet with (E-034): the alias,
    // no names -- a transfer files its sender with no more than that (SendEmailCommandParams).
    // Without an alias, no field.
    ...(senderUser.alias ? { senderAlias: senderUser.alias } : {}),
    // A letter says so, and a chat message only a wish for no mail. A command without
    // `notify` is mailed by every server, one from before the chat included
    // (parseChatMessageNotify), so 'email' needs no field. A server from before P3c reads
    // 'letter' as 'email' and asks the quiet, as it did for the form until now (accepted,
    // E-034).
    ...(letter
      ? { notify: CHAT_MESSAGE_NOTIFY_LETTER }
      : notify === ChatMessageNotify.NONE
        ? { notify }
        : {}),
    // P7b: the pictures travel with the message, as base64 -- as the wallet uploads them. Without
    // a picture, no field.
    ...(pictures.length > 0
      ? {
          images: pictures.map(({ imageUuid, width, height, image }) => ({
            imageUuid,
            width,
            height,
            data: image.toString('base64'),
          })),
        }
      : {}),
  }
  const payload = new CommandJwtPayloadType(
    handshakeID,
    SendEmailCommand.SEND_MAIL_COMMAND,
    SendEmailCommand.name,
    [JSON.stringify(params)],
  )
  const jws = await encryptAndSign(payload, senderCom.privateJwtKey!, receiverCom.publicJwtKey!)
  const args = new EncryptedTransferArgs()
  args.publicKey = senderCom.publicKey.toString('hex')
  args.jwt = jws
  args.handshakeID = handshakeID
  // ⛔ Measured sealed, as it will go out, before anything is filed or sent.
  if (!commandRequestFits(args)) {
    throw new LogError('CHAT_MESSAGE_NOT_SENT: TOO_LARGE_ACROSS_BORDER', commandRequestBytes(args))
  }

  // The own copy only for a recipient the receiving server can look up (see above).
  const recipient =
    receiverCom.communityUuid &&
    v.safeParse(uuidv4Schema, receiverCom.communityUuid).success &&
    v.safeParse(uuidv4Schema, recipientGradidoId).success
      ? { communityUuid: receiverCom.communityUuid, gradidoId: recipientGradidoId }
      : null
  if (
    pictures.length > 0 &&
    !(recipient && (await storeChatMessageImages(messageUuid, pictures)))
  ) {
    return { stored: null, error: null }
  }
  const ownCopy = recipient
    ? await storeChatMessage(
        {
          messageUuid,
          sender: { communityUuid: senderUser.communityUuid, gradidoId: senderUser.gradidoID },
          recipient,
          subject,
          body,
          notify,
          deliveryState: ChatMessageDeliveryState.PENDING,
        },
        'outgoing',
      )
    : null
  if (!ownCopy && pictures.length > 0) {
    await removeChatMessageImages(messageUuid)
  }
  if (!ownCopy && requireStored) {
    return { stored: null, error: null }
  }
  // The answer, not only whether there was one: sendCommand would read every answer as an error.
  const answer = await cmdClient.sendCommandForAnswer(args)
  const error = answer.success ? null : answer.error
  if (!ownCopy) {
    return { stored: null, error }
  }
  const deliveryState = answer.success
    ? ChatMessageDeliveryState.DELIVERED
    : ChatMessageDeliveryState.FAILED
  const mailState = answer.success ? chatMessageMailStateOfAnswer(answer.value) : null
  const recordedAt = await recordChatMessageDelivery(ownCopy.id, deliveryState, mailState)
  // What the row says now: the new state where it was recorded, the copy as filed where not.
  return {
    stored: recordedAt
      ? { ...ownCopy, deliveryState, lastAttemptAt: recordedAt, mailState }
      : ownCopy,
    error,
  }
}
