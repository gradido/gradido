import { JwtPayloadType } from './JwtPayloadType'

export class AuthenticationResponseJwtPayloadType extends JwtPayloadType {
  static AUTHENTICATION_RESPONSE_TYPE = 'authenticationResponse'

  uuid: string

  constructor(handshakeID: string, uuid: string) {
    super(handshakeID)
    this.tokentype = AuthenticationResponseJwtPayloadType.AUTHENTICATION_RESPONSE_TYPE
    this.uuid = uuid
  }
}
