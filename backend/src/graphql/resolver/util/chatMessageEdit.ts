// AI-GENERATED — not an architecture reference
import {
  ApiVersionType,
  CommandClientFactory,
  EDIT_CHAT_MESSAGE_COMMAND_ANSWER,
  EditChatMessageCommand,
  EditChatMessageCommandParams,
  EncryptedTransferArgs,
  V1_0_CommandClient,
} from 'core'
import {
  ChatMemberRef,
  getCommunityByUuid,
  getCommunityWithFederatedCommunityByIdentifier,
} from 'database'
import { CommandJwtPayloadType, encryptAndSign, VoidResult } from 'shared'
import { randombytes_random } from 'sodium-native'

/**
 * Why a changed text did not reach the other server, for the member's wallet and for the log:
 * - NO_WAY_TO_DELIVER: no V1_0 entry of the other community, no client for it, or no keys
 *   exchanged to seal the command with -- as for a message being sent;
 * - NOT_CONFIRMED: the command went out and the answer was not the one word that says the copy
 *   over there was changed. The other server refused, does not know the command yet, or did not
 *   answer. `detail` is what it said, for the log.
 */
export interface ChatMessageEditNotCarried {
  reason: 'NO_WAY_TO_DELIVER' | 'NOT_CONFIRMED'
  detail: string
}

/**
 * Carries the changed text of a message to the server of the other member of the conversation
 * (E-060): a command of its own, sealed like a message being sent, naming the writer, the message
 * by the uuid both copies carry, and the new text.
 *
 * ⛔ Success is the one word the command answers where it changed its copy
 * (EDIT_CHAT_MESSAGE_COMMAND_ANSWER), and nothing else -- not "no error". A server from before
 * this command answers "Command EDIT_CHAT_MESSAGE_COMMAND not found"; one that could not be
 * reached answers nothing. In both cases the caller leaves its own copy as it is, so that the
 * two members go on reading the same words.
 *
 * Nothing is written here, on either side of a failure. The text is not measured against the
 * request limit: a full text fits beside a picture (FEDERATION_REQUEST_MAX_BYTES), so alone it
 * always fits.
 *
 * Never throws for what the other server does; the keys are checked, not asserted.
 */
export async function carryChatMessageEditAcrossBorder({
  writer,
  otherCommunityUuid,
  messageUuid,
  body,
}: {
  writer: ChatMemberRef
  otherCommunityUuid: string
  messageUuid: string
  body: string
}): Promise<VoidResult<ChatMessageEditNotCarried>> {
  const senderCom = await getCommunityByUuid(writer.communityUuid)
  const receiverCom = await getCommunityWithFederatedCommunityByIdentifier(otherCommunityUuid)
  const receiverFCom = receiverCom?.federatedCommunities?.find(
    (fcom) => fcom.apiVersion === ApiVersionType.V1_0,
  )
  const cmdClient = receiverFCom ? CommandClientFactory.getInstance(receiverFCom) : null
  if (
    !senderCom?.privateJwtKey ||
    !senderCom.publicKey ||
    !receiverCom?.publicJwtKey ||
    !(cmdClient instanceof V1_0_CommandClient)
  ) {
    return {
      success: false,
      error: { reason: 'NO_WAY_TO_DELIVER', detail: otherCommunityUuid },
    }
  }
  const handshakeID = randombytes_random().toString()
  const params: EditChatMessageCommandParams = {
    senderComUuid: writer.communityUuid,
    senderGradidoId: writer.gradidoId,
    messageUuid,
    body,
  }
  const payload = new CommandJwtPayloadType(
    handshakeID,
    EditChatMessageCommand.EDIT_CHAT_MESSAGE_COMMAND,
    EditChatMessageCommand.name,
    [JSON.stringify(params)],
  )
  const args = new EncryptedTransferArgs()
  args.publicKey = senderCom.publicKey.toString('hex')
  args.jwt = await encryptAndSign(payload, senderCom.privateJwtKey, receiverCom.publicJwtKey)
  args.handshakeID = handshakeID

  const answer = await cmdClient.sendCommandForAnswer(args)
  if (answer.success && answer.value === EDIT_CHAT_MESSAGE_COMMAND_ANSWER) {
    return { success: true }
  }
  return {
    success: false,
    error: {
      reason: 'NOT_CONFIRMED',
      detail: answer.success ? `answered ${JSON.stringify(answer.value)}` : answer.error,
    },
  }
}
