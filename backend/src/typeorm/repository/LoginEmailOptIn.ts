import { EntityRepository, Repository } from '@dbTools/typeorm'
import { LoginEmailOptIn } from '@entity/LoginEmailOptIn'

@EntityRepository(LoginEmailOptIn)
export class LoginEmailOptInRepository extends Repository<LoginEmailOptIn> {}
