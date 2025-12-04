import { JwtPayloadType } from './JwtPayloadType'

export class OpenConnectionCallbackJwtPayloadType extends JwtPayloadType {
  static OPEN_CONNECTION_CALLBACK_TYPE = 'open-connection-callback'

  oneTimeCode: string
  url: string

  constructor(handshakeID: string, oneTimeCode: string, url: string) {
    super(handshakeID)
    this.tokentype = OpenConnectionCallbackJwtPayloadType.OPEN_CONNECTION_CALLBACK_TYPE
    this.oneTimeCode = oneTimeCode
    this.url = url
  }
}
