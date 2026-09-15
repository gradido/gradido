import { JwtPayloadType } from './JwtPayloadType'

export class SendCoinsResponseJwtPayloadType extends JwtPayloadType {
  static SEND_COINS_RESPONSE_TYPE = 'send-coins-response'

  vote: boolean
  recipGradidoID: string | null
  recipFirstName: string | null
  recipLastName: string | null
  recipAlias: string | null
  /**
   * When the recipient last changed the picture members may see, ISO 8601 -- sent with the
   * answer to the vote (federation voteForSendCoins).
   *
   * null: no date to send -- the recipient has nothing to show (no picture, switch off), or the
   * date could not be read. Left out: the answer comes from a server that does not know the
   * field. JSON drops an undefined value, so the key is then missing on the sender's side.
   */
  recipAvatarUpdatedAt?: string | null

  constructor(
    handshakeID: string,
    vote: boolean,
    recipGradidoID: string | null,
    recipFirstName: string | null,
    recipLastName: string | null,
    recipAlias: string | null,
    recipAvatarUpdatedAt?: string | null,
  ) {
    super(handshakeID)
    this.tokentype = SendCoinsResponseJwtPayloadType.SEND_COINS_RESPONSE_TYPE
    this.vote = vote
    this.recipGradidoID = recipGradidoID
    this.recipFirstName = recipFirstName
    this.recipLastName = recipLastName
    this.recipAlias = recipAlias
    this.recipAvatarUpdatedAt = recipAvatarUpdatedAt
  }
}
