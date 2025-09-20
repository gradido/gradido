// import { JWTPayload } from 'jose'
import { JwtPayloadType } from './JwtPayloadType'

export class DisburseJwtPayloadType extends JwtPayloadType {
  static DISBURSE_ACTIVATION_TYPE = 'disburse-activation'

  sendercommunityuuid: string
  sendergradidoid: string
  recipientcommunityuuid: string
  recipientcommunityname: string
  recipientgradidoid: string
  recipientfirstname: string
  code: string
  amount: string
  memo: string
  validuntil: string
  recipientalias: string

  constructor(
    handshakeID: string,
    senderCommunityUuid: string,
    senderGradidoId: string,
    recipientCommunityUuid: string,
    recipientCommunityName: string,
    recipientGradidoId: string,
    recipientFirstName: string,
    code: string,
    amount: string,
    memo: string,
    validUntil: string,
    recipientAlias: string,
  ) {
    super(handshakeID)
    this.tokentype = DisburseJwtPayloadType.DISBURSE_ACTIVATION_TYPE
    this.sendercommunityuuid = senderCommunityUuid
    this.sendergradidoid = senderGradidoId
    this.recipientcommunityuuid = recipientCommunityUuid
    this.recipientcommunityname = recipientCommunityName
    this.recipientgradidoid = recipientGradidoId
    this.recipientfirstname = recipientFirstName
    this.code = code
    this.amount = amount
    this.memo = memo
    this.validuntil = validUntil
    this.recipientalias = recipientAlias
  }
}
