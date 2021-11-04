import { EntityRepository, Repository } from 'typeorm'
import { LoginEmailOptIn } from '@entity/LoginEmailOptIn'

@EntityRepository(LoginEmailOptIn)
export class LoginEmailOptInRepository extends Repository<LoginEmailOptIn> {}
