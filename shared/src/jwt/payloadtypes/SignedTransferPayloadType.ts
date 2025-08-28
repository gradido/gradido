import { JwtPayloadType } from './JwtPayloadType'

export class SignedTransferPayloadType extends JwtPayloadType {
  static SIGNED_TRANSFER_TYPE = 'signed-transfer'

  publicKey: string
  jwt: string

  constructor(
    publicKey: string,
    jwt: string,
    handshakeID: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(handshakeID)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.tokentype = SignedTransferPayloadType.SIGNED_TRANSFER_TYPE
    this.publicKey = publicKey
    this.jwt = jwt
  }
}
