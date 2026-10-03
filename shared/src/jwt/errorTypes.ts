import { DomainError } from '../errorTypes'

/**
 * Why an authentication was rejected, for callers that have to tell the reasons apart.
 */
export enum AuthenticationFailedType {
  INVALID_SIGNATURE,
  INVALID_JWT_TOKEN,
  EXPIRED_JWT_TOKEN,
  UNEXPECTED_FORMAT,
}

/**
 * Expected failure of an authentication, returned in a `Result` rather than thrown.
 * `message` is for the log, `type` for the code.
 */
export class AuthenticationFailed extends DomainError {
  public constructor(
    message: string,
    public readonly type: AuthenticationFailedType,
  ) {
    super(message)
  }
}
