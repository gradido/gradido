// import { JWTPayload } from 'jose'
import { JwtPayloadType } from './JwtPayloadType'

export class OpenConnectionJwtPayloadType extends JwtPayloadType {
  static OPEN_CONNECTION_TYPE = 'open-connection'

  url: string

  constructor(
    url: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.tokentype = OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE
    this.url = url
  }
}
