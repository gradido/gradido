import { DomainError } from '../errorTypes'

export enum AuthenticationFailedType {
  NOT_FOUND,
  WRONG_PASSWORD,
  INVALID_SIGNATURE,
  INVALID_JWT_TOKEN,
  EXPIRED_JWT_TOKEN,
  UNEXPECTED_FORMAT,
}

export class AuthenticationFailed extends DomainError {
  public constructor(
    message: string,
    public readonly type: AuthenticationFailedType,
  ) {
    super(message)
  }
}
