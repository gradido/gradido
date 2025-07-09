// import { JWTPayload } from 'jose'
import { JwtPayloadType } from './JwtPayloadType'

export class OpenConnectionCallbackJwtPayloadType extends JwtPayloadType {
  static OPEN_CONNECTION_CALLBACK_TYPE = 'open-connection-callback'

  oneTimeCode: string
  url: string

  constructor(
    handshakeID: string,
    oneTimeCode: string,
    url: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(handshakeID)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.tokentype = OpenConnectionCallbackJwtPayloadType.OPEN_CONNECTION_CALLBACK_TYPE
    this.oneTimeCode = oneTimeCode
    this.url = url
  }
}
