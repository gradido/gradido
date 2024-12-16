import { AbstractUser } from './AbstractUser'
import { Password } from './Password'

// only add password as filed, rest the same as AbstractUser
export class PostUser extends AbstractUser {
  password: Password
}
