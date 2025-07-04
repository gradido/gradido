import { JwtPayloadType } from './JwtPayloadType'

export class AuthenticationJwtPayloadType extends JwtPayloadType {
  static AUTHENTICATION_TYPE = 'authentication'

  oneTimeCode: string
  uuid: string

  constructor(
    oneTimeCode: string,
    uuid: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.tokentype = AuthenticationJwtPayloadType.AUTHENTICATION_TYPE
    this.oneTimeCode = oneTimeCode
    this.uuid = uuid
  }
}
