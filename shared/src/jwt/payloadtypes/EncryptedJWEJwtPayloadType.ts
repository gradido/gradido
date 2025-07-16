import { JwtPayloadType } from './JwtPayloadType'

export class EncryptedJWEJwtPayloadType extends JwtPayloadType {
  static ENCRYPTED_JWE_TYPE = 'encrypted-jwe'

  jwe: string

  constructor(
    handshakeID: string,
    jwe: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(handshakeID)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.tokentype = EncryptedJWEJwtPayloadType.ENCRYPTED_JWE_TYPE
    this.jwe = jwe
  }
}
