import { EntityRepository, Repository } from 'typeorm'
import { LoginUserBackup } from '@entity/LoginUserBackup'

@EntityRepository(LoginUserBackup)
export class LoginUserBackupRepository extends Repository<LoginUserBackup> {}
