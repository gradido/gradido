import { Logger } from 'log4js'
import { CreateUser } from './createUser.schema'

// T is what the role parsed its input into: CreateUser for the plain registration, the narrower
// type of its own schema for a variant - so `this.user` carries the fields the variant lives on.
export abstract class AbstractRegisterUserRole<T extends CreateUser = CreateUser> {
  constructor(
    protected user: T,
    protected startDate = new Date(),
  ) {}
  public abstract run(logger: Logger): Promise<number>
  public abstract getRoleTitle(): string
}
