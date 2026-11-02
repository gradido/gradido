import { DomainError } from '../errorTypes'

export class InvalidResponseSignatureError extends DomainError {
  constructor(public readonly reason: string) {
    super(`invalid response signature: ${reason}`)
  }
}
