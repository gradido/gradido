import { JwtPayloadType } from './JwtPayloadType'

export class AuthenticationJwtPayloadType extends JwtPayloadType {
  static AUTHENTICATION_TYPE = 'authentication'

  oneTimeCode: string
  uuid: string

  constructor(handshakeID: string, oneTimeCode: string, uuid: string) {
    super(handshakeID)
    this.tokentype = AuthenticationJwtPayloadType.AUTHENTICATION_TYPE
    this.oneTimeCode = oneTimeCode
    this.uuid = uuid
  }
}
