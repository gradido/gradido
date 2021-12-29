import { EntityRepository, Repository } from 'typeorm'
import { LoginElopageBuys } from '@entity/LoginElopageBuys'

@EntityRepository(LoginElopageBuys)
export class LoginElopageBuysRepository extends Repository<LoginElopageBuys> {}
