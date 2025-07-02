// import { JWTPayload } from 'jose'
import { JwtPayloadType } from './JwtPayloadType'

export class EncryptedJWEJwtPayloadType extends JwtPayloadType {
  static ENCRYPTED_JWE_TYPE = 'encrypted-jwe'

  jwe: string

  constructor(
    jwe: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.tokentype = EncryptedJWEJwtPayloadType.ENCRYPTED_JWE_TYPE
    this.jwe = jwe
  }
}
