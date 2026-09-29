// AI-GENERATED — not an architecture reference
import {
  ChatMessageImageAccepted,
  chatMailWentOut,
  databaseErrorCode,
  removeChatMessageImages,
  sendChatGroupAddedEmail,
  sendChatGroupMessageEmail,
  storeChatMessageImages,
} from 'core'
import {
  ChatConversationSelect,
  ChatMemberRef,
  ChatMessageDeliveryState,
  ChatMessageNotify,
  ChatMessageSelect,
  User as DbUser,
  dbFindUsersWithEmailContactByIds,
  dbInsertChatMessage,
  dbSelectChatConversationMembers,
  dbSelectUsersByUuids,
} from 'database'
import { getLogger } from 'log4js'
import { v4 as uuidv4 } from 'uuid'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { isSameChatMember } from '@/data/ChatConversation.logic'
import { PublishNameLogic } from '@/data/PublishName.logic'

/*
 * How a message written in a group (P5) is filed, and the two mails of a group: "you are in the
 * group now" to whoever is taken in (E-049), and the announcement to every member who has not
 * muted it (E-024, E-050 F5).
 *
 * Nothing here writes a message's text or a group's name into a log.
 */

const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.chatGroupDelivery`)

/**
 * Files a message written in a group -- one row, which every member reads -- with its pictures,
 * in the order deliverChatMessageLocally files one between two members: the pictures first,
 * under the message's uuid, then the message; where the message could not be filed, its pictures
 * are taken back out. Hands back the row, or null where nothing is filed: the message was not
 * sent then, and nothing is mailed.
 *
 * The row carries the sender's wish -- 'email' for an announcement, 'none' otherwise -- and no
 * mail state: `mail_state` is one value per row and fits one recipient only, and who muted the
 * group is nobody's business but theirs (E-024). Delivered on arrival: in P5 every member reads
 * it on this server.
 *
 * ⛔ Never throws, like storeChatMessage, and for the same reason: a failed Drizzle query carries
 * its parameters in its message, and the parameters are the message's text. Thrown on, it would
 * reach the request's error log. The log gets the message's uuid and the database's error code
 * (databaseErrorCode) instead.
 */
export async function storeChatGroupMessage({
  group,
  sender,
  body,
  announce,
  images,
}: {
  group: ChatConversationSelect
  sender: ChatMemberRef
  body: string
  announce: boolean
  images: ChatMessageImageAccepted[]
}): Promise<ChatMessageSelect | null> {
  const logger = createLogger()
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
  try {
    const stored = await dbInsertChatMessage({
      messageUuid,
      conversationId: group.id,
      senderCommunityUuid: sender.communityUuid,
      senderGradidoId: sender.gradidoId,
      subject: null,
      body,
      notify: announce ? ChatMessageNotify.EMAIL : ChatMessageNotify.NONE,
      deliveryState: ChatMessageDeliveryState.DELIVERED,
    })
    if (stored.success) {
      logger.info(
        `chat group message stored: message_uuid=${messageUuid} conversation_id=${group.id}`,
      )
      return stored.value
    }
    logger.error(
      `chat group message not stored: message_uuid=${messageUuid} (${stored.error.message})`,
    )
  } catch (error) {
    logger.error(
      `chat group message not stored: message_uuid=${messageUuid} (${databaseErrorCode(error)})`,
    )
  }
  if (images.length > 0) {
    await removeChatMessageImages(messageUuid)
  }
  return null
}

/**
 * The members named by these pairs who can be mailed from here: members of this community with
 * an address, whose accounts are not deleted -- with the address, their names and their language,
 * for the mail. A member of another community is mailed by their own server (P6).
 */
export async function mailableChatMembers(pairs: ChatMemberRef[]): Promise<DbUser[]> {
  const ids = (await dbSelectUsersByUuids(pairs))
    .filter((row) => row.deletedAt === null)
    .map((row) => row.id)
  if (ids.length === 0) {
    return []
  }
  return (await dbFindUsersWithEmailContactByIds(ids)).filter(
    (user) => !user.foreign && Boolean(user.emailContact?.email),
  )
}

/**
 * Who an announcement in the group goes to (E-024, E-050 F5): every member but the sender who has
 * not muted the group, read when the message is sent.
 */
export async function chatGroupAnnouncementRecipients(
  group: ChatConversationSelect,
  sender: ChatMemberRef,
): Promise<DbUser[]> {
  const members = await dbSelectChatConversationMembers(group.id)
  return mailableChatMembers(
    members.filter((member) => member.mutedAt === null && !isSameChatMember(member, sender)),
  )
}

/**
 * Sends one mail per recipient, one after the other: up to 99 of them for an announcement. A
 * mail that fails does not hold up the next one. The log gets what the mails were about -- the
 * kind and the group's uuid -- and how many went out, never a text or a group's name.
 *
 * ⛔ The request does not wait for this (build plan 4.4): the message is sent once it is filed,
 * and the mails follow. The promise of the whole run never rejects; it is handed back for a test
 * to wait on.
 */
async function mailOneAfterAnother(
  recipients: DbUser[],
  mail: (recipient: DbUser) => Promise<unknown>,
  about: string,
): Promise<void> {
  const logger = createLogger()
  let sent = 0
  for (const recipient of recipients) {
    try {
      if (chatMailWentOut(await mail(recipient))) {
        sent += 1
      }
    } catch (error) {
      logger.error(
        `chat group mail failed: ${about} user_id=${recipient.id} (${error instanceof Error ? error.name : 'unknown'})`,
      )
    }
  }
  logger.info(`chat group mails: ${about} sent=${sent} of ${recipients.length}`)
}

/** Who the mail is to, as every mail of this server names them. */
const addressOf = (recipient: DbUser) => ({
  firstName: recipient.firstName,
  lastName: recipient.lastName,
  email: recipient.emailContact.email,
  language: recipient.language,
})

/**
 * The mail "you are in the group now" (E-008, E-049) to every member taken in -- sent as a mail
 * whatever else they muted: it is the first word of the group to them, and the way out of it is
 * one tap away. `memberCount` counts the group with them.
 */
export function mailChatGroupAdded({
  group,
  adder,
  added,
  memberCount,
}: {
  group: ChatConversationSelect
  adder: DbUser
  added: DbUser[]
  memberCount: number
}): Promise<void> {
  const adderAlias = new PublishNameLogic(adder).getPublicAlias()
  return mailOneAfterAnother(
    added,
    (recipient) =>
      sendChatGroupAddedEmail({
        ...addressOf(recipient),
        adderAlias,
        groupTitle: group.title ?? '',
        groupUuid: group.conversationUuid,
        memberCount,
      }),
    `added group=${group.conversationUuid}`,
  )
}

/**
 * An announcement (E-024, E-050 F5) to the recipients chatGroupAnnouncementRecipients found. The
 * mail says there is a picture where there is one, and shows none (MAIL-008).
 */
export function mailChatGroupAnnouncement({
  group,
  senderUser,
  recipients,
  body,
  hasImage,
}: {
  group: ChatConversationSelect
  senderUser: DbUser
  recipients: DbUser[]
  body: string
  hasImage: boolean
}): Promise<void> {
  const senderAlias = new PublishNameLogic(senderUser).getPublicAlias()
  return mailOneAfterAnother(
    recipients,
    (recipient) =>
      sendChatGroupMessageEmail({
        ...addressOf(recipient),
        senderAlias,
        groupTitle: group.title ?? '',
        groupUuid: group.conversationUuid,
        memo: body,
        hasImage,
      }),
    `announcement group=${group.conversationUuid}`,
  )
}
