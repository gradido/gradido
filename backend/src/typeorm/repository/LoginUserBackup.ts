import { EntityRepository, Repository } from '@dbTools/typeorm'
import { LoginUserBackup } from '@entity/LoginUserBackup'

@EntityRepository(LoginUserBackup)
export class LoginUserBackupRepository extends Repository<LoginUserBackup> {}
