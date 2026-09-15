import { JwtPayloadType } from './JwtPayloadType'

export class SendCoinsJwtPayloadType extends JwtPayloadType {
  static SEND_COINS_TYPE = 'send-coins'

  recipientCommunityUuid: string
  recipientUserIdentifier: string
  creationDate: string
  amount: string
  memo: string
  senderCommunityUuid: string
  senderUserUuid: string
  senderUserName: string
  senderAlias?: string | null
  transactionLinkId?: number | null
  /**
   * When the sender last changed the picture members may see, ISO 8601. Set in the SETTLE
   * payload only (processXComCommittingSendCoins) -- the booking and the mirror row of the
   * sender come into being there. The vote payload leaves it out on purpose.
   *
   * null: no date to send -- the sender has nothing to show (no picture, switch off), or the
   * date could not be read. Left out: the payload was built without it -- by the vote, or by a
   * server that does not know the field. JSON drops an undefined value, so the key is then
   * missing on the other side.
   */
  senderAvatarUpdatedAt?: string | null

  constructor(
    handshakeID: string,
    recipientCommunityUuid: string,
    recipientUserIdentifier: string,
    creationDate: string,
    amount: string,
    memo: string,
    senderCommunityUuid: string,
    senderUserUuid: string,
    senderUserName: string,
    senderAlias?: string | null,
    transactionLinkId?: number | null,
    senderAvatarUpdatedAt?: string | null,
  ) {
    super(handshakeID)
    this.tokentype = SendCoinsJwtPayloadType.SEND_COINS_TYPE
    this.recipientCommunityUuid = recipientCommunityUuid
    this.recipientUserIdentifier = recipientUserIdentifier
    this.creationDate = creationDate
    this.amount = amount
    this.memo = memo
    this.senderCommunityUuid = senderCommunityUuid
    this.senderUserUuid = senderUserUuid
    this.senderUserName = senderUserName
    this.senderAlias = senderAlias
    this.transactionLinkId = transactionLinkId
    this.senderAvatarUpdatedAt = senderAvatarUpdatedAt
  }
}
