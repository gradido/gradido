import { JwtPayload } from 'jsonwebtoken'

export interface CustomJwtPayload extends JwtPayload {
  gradidoID: Buffer
}
