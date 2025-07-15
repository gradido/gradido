// import { JWTPayload } from 'jose'
import { JwtPayloadType } from './JwtPayloadType'

export class RedeemJwtPayloadType extends JwtPayloadType {
  static REDEEM_ACTIVATION_TYPE = 'redeem-activation'

  sendercommunityuuid: string
  sendergradidoid: string
  sendername: string // alias or firstname
  redeemcode: string
  amount: string
  memo: string
  validuntil: string

  constructor(
    senderCom: string,
    senderUser: string,
    sendername: string,
    code: string,
    amount: string,
    memo: string,
    validUntil: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super('handshakeID')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.tokentype = RedeemJwtPayloadType.REDEEM_ACTIVATION_TYPE
    this.sendercommunityuuid = senderCom
    this.sendergradidoid = senderUser
    this.sendername = sendername
    this.redeemcode = code
    this.amount = amount
    this.memo = memo
    this.validuntil = validUntil
  }
}
