// AI-GENERATED — not an architecture reference
import {
  chatMailWanted,
  EncryptedTransferArgs,
  readChatMemberMutedAt,
  recordChatMessageDelivery,
  SendEmailCommand,
  sendCustomEmail,
  storeChatMessage,
  V1_0_CommandClient,
} from 'core'
import {
  ChatMessageDeliveryState,
  ChatMessageNotify,
  ChatMessageSelect,
  Community as DbCommunity,
  User as DbUser,
} from 'database'
import { CommandJwtPayloadType, encryptAndSign, uuidv4Schema } from 'shared'
import { randombytes_random } from 'sodium-native'
import { v4 as uuidv4 } from 'uuid'
import { PublishNameLogic } from '@/data/PublishName.logic'

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
}

/**
 * Files a message between two members of this community -- one row, which both of them read --
 * and mails it when that is wanted: asked for, and not muted by the recipient (E-024). The mail
 * goes out without being waited for, as it always has.
 *
 * Hands back the row, or null where it could not be filed. The chat's message was not sent then,
 * and nothing is mailed; the form's mail goes out regardless.
 */
export async function deliverChatMessageLocally({
  senderUser,
  recipientUser,
  subject,
  body,
  notify,
  requireStored,
}: ChatMessageLocalDelivery): Promise<ChatMessageSelect | null> {
  const recipient = {
    communityUuid: recipientUser.communityUuid,
    gradidoId: recipientUser.gradidoID,
  }
  const stored = await storeChatMessage(
    {
      messageUuid: uuidv4(),
      sender: { communityUuid: senderUser.communityUuid, gradidoId: senderUser.gradidoID },
      recipient,
      subject,
      body,
      notify,
      deliveryState: ChatMessageDeliveryState.DELIVERED,
    },
    'local',
  )
  if (!stored && requireStored) {
    return null
  }
  // Without a row there is no conversation, and no mark to read: the form's mail goes out.
  const mutedAt = stored ? await readChatMemberMutedAt(stored.conversationId, recipient) : null
  if (chatMailWanted(notify, mutedAt) && recipientUser.emailContact) {
    sendCustomEmail({
      firstName: recipientUser.firstName,
      lastName: recipientUser.lastName,
      email: recipientUser.emailContact.email,
      language: recipientUser.language,
      senderAlias: new PublishNameLogic(senderUser).getPublicAlias(),
      subject: subject ?? '',
      memo: body,
      senderUuid: senderUser.gradidoID,
      senderCommunityUuid: senderUser.communityUuid,
    })
  }
  return stored
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
 * Hands back the own copy with the state it has now, or null where none was filed, and the
 * error the other community answered with, or null. A failed delivery is not thrown: what to
 * make of it is the caller's. Throws only where the command cannot be sealed -- before anything
 * is filed or sent.
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
}: ChatMessageBorderDelivery): Promise<{ stored: ChatMessageSelect | null; error: string | null }> {
  // The id both copies are filed under: this server's below, the receiving server's from the
  // payload.
  const messageUuid = uuidv4()
  const handshakeID = randombytes_random().toString()
  const payload = new CommandJwtPayloadType(
    handshakeID,
    SendEmailCommand.SEND_MAIL_COMMAND,
    SendEmailCommand.name,
    [
      JSON.stringify({
        mailType: 'sendCustomEmail',
        senderComUuid: senderUser.communityUuid,
        senderGradidoId: senderUser.gradidoID,
        receiverComUuid: receiverComIdentifier,
        receiverGradidoId: recipientGradidoId,
        subject: subject ?? '',
        memo: body,
        messageUuid,
        // Only a wish for no mail travels. A command without `notify` is mailed by every server,
        // one from before the chat included (parseChatMessageNotify), so 'email' needs no field
        // -- and the command of the form stays what it was.
        ...(notify === ChatMessageNotify.NONE ? { notify } : {}),
      }),
    ],
  )
  const jws = await encryptAndSign(payload, senderCom.privateJwtKey!, receiverCom.publicJwtKey!)
  const args = new EncryptedTransferArgs()
  args.publicKey = senderCom.publicKey.toString('hex')
  args.jwt = jws
  args.handshakeID = handshakeID

  const ownCopy =
    receiverCom.communityUuid &&
    uuidv4Schema.safeParse(receiverCom.communityUuid).success &&
    uuidv4Schema.safeParse(recipientGradidoId).success
      ? await storeChatMessage(
          {
            messageUuid,
            sender: { communityUuid: senderUser.communityUuid, gradidoId: senderUser.gradidoID },
            recipient: { communityUuid: receiverCom.communityUuid, gradidoId: recipientGradidoId },
            subject,
            body,
            notify,
            deliveryState: ChatMessageDeliveryState.PENDING,
          },
          'outgoing',
        )
      : null
  if (!ownCopy && requireStored) {
    return { stored: null, error: null }
  }
  const result = await cmdClient.sendCommand(args)
  const error = typeof result === 'string' ? result : null
  if (!ownCopy) {
    return { stored: null, error }
  }
  const deliveryState =
    error === null ? ChatMessageDeliveryState.DELIVERED : ChatMessageDeliveryState.FAILED
  const recordedAt = await recordChatMessageDelivery(ownCopy.id, deliveryState)
  // What the row says now: the new state where it was recorded, the copy as filed where not.
  return {
    stored: recordedAt ? { ...ownCopy, deliveryState, lastAttemptAt: recordedAt } : ownCopy,
    error,
  }
}
