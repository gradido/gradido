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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(handshakeID)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.tokentype = SendCoinsResponseJwtPayloadType.SEND_COINS_RESPONSE_TYPE
    this.vote = vote
    this.recipGradidoID = recipGradidoID
    this.recipFirstName = recipFirstName
    this.recipLastName = recipLastName
    this.recipAlias = recipAlias
  }
}
