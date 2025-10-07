import { JwtPayloadType } from './JwtPayloadType'

export class EncryptedJWEJwtPayloadType extends JwtPayloadType {
  static ENCRYPTED_JWE_TYPE = 'encrypted-jwe'

  jwe: string

  constructor(
    handshakeID: string,
    jwe: string,
  ) {
    super(handshakeID)
    this.tokentype = EncryptedJWEJwtPayloadType.ENCRYPTED_JWE_TYPE
    this.jwe = jwe
  }
}
