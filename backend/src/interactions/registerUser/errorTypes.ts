import { UserSelect } from 'database'
import { DomainError } from 'shared'

export class RegisterUserDuplicateError extends DomainError {
  public constructor(public user: UserSelect) {
    super('User already exists')
  }
}
