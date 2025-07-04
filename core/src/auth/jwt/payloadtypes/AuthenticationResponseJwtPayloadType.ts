import { JwtPayloadType } from './JwtPayloadType'

export class AuthenticationResponseJwtPayloadType extends JwtPayloadType {
  static AUTHENTICATION_RESPONSE_TYPE = 'authenticationResponse'

  uuid: string

  constructor(
    uuid: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.tokentype = AuthenticationResponseJwtPayloadType.AUTHENTICATION_RESPONSE_TYPE
    this.uuid = uuid
  }
}
