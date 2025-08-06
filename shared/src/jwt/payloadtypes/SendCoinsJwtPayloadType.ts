import { JwtPayloadType } from './JwtPayloadType'
import { Decimal } from 'decimal.js-light'

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
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(handshakeID)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
  }
}
