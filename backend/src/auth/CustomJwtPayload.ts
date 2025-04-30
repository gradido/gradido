import type { JWTPayload } from 'jose'

export interface CustomJwtPayload extends JWTPayload {
  gradidoID: string
}
