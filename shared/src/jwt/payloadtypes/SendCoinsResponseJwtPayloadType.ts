import { JwtPayloadType } from './JwtPayloadType'

export class SendCoinsResponseJwtPayloadType extends JwtPayloadType {
  static SEND_COINS_RESPONSE_TYPE = 'send-coins-response'

  vote: boolean
  recipGradidoID: string | null
  recipFirstName: string | null
  recipLastName: string | null
  recipAlias: string | null


  constructor(
    handshakeID: string,
    vote: boolean,
    recipGradidoID: string | null,
    recipFirstName: string | null,
    recipLastName: string | null,
    recipAlias: string | null,
  ) {
    super(handshakeID)
    this.tokentype = SendCoinsResponseJwtPayloadType.SEND_COINS_RESPONSE_TYPE
    this.vote = vote
    this.recipGradidoID = recipGradidoID
    this.recipFirstName = recipFirstName
    this.recipLastName = recipLastName
    this.recipAlias = recipAlias
  }
}
