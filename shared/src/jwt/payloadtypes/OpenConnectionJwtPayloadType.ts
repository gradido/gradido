import { JwtPayloadType } from './JwtPayloadType'

export class OpenConnectionJwtPayloadType extends JwtPayloadType {
  static OPEN_CONNECTION_TYPE = 'open-connection'

  url: string

  constructor(
    handshakeID: string,
    url: string,
  ) {
    super(handshakeID)
    this.tokentype = OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE
    this.url = url
  }
}
