import { Logger } from 'log4js'
import { CreateUser } from './createUser.schema'

export abstract class AbstractRegisterUserRole {
  constructor(
    protected user: CreateUser,
    protected startDate = new Date(),
  ) {}
  public abstract run(logger: Logger): Promise<number>
}
