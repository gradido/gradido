import { Decimal } from 'decimal.js-light'
import { JwtPayloadType } from './JwtPayloadType'

export class SendCoinsJwtPayloadType extends JwtPayloadType {
  static SEND_COINS_TYPE = 'send-coins'

  recipientCommunityUuid: string
  recipientUserIdentifier: string
  creationDate: string
  amount: Decimal
  memo: string
  senderCommunityUuid: string
  senderUserUuid: string
  senderUserName: string
  senderAlias?: string | null
  transactionLinkId?: number | null

  constructor(
    handshakeID: string,
    recipientCommunityUuid: string,
    recipientUserIdentifier: string,
    creationDate: string,
    amount: Decimal,
    memo: string,
    senderCommunityUuid: string,
    senderUserUuid: string,
    senderUserName: string,
    senderAlias?: string | null,
    transactionLinkId?: number | null,
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
  }
}
