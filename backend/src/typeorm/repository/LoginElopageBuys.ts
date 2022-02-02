import { EntityRepository, Repository } from '@dbTools/typeorm'
import { LoginElopageBuys } from '@entity/LoginElopageBuys'

@EntityRepository(LoginElopageBuys)
export class LoginElopageBuysRepository extends Repository<LoginElopageBuys> {}
