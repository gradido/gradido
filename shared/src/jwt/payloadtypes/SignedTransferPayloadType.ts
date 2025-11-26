import { JwtPayloadType } from './JwtPayloadType'

export class SignedTransferPayloadType extends JwtPayloadType {
  static SIGNED_TRANSFER_TYPE = 'signed-transfer'

  publicKey: string
  jwt: string

  constructor(publicKey: string, jwt: string, handshakeID: string) {
    super(handshakeID)
    this.tokentype = SignedTransferPayloadType.SIGNED_TRANSFER_TYPE
    this.publicKey = publicKey
    this.jwt = jwt
  }
}
