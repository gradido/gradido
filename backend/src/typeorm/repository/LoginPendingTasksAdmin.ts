import { EntityRepository, Repository } from 'typeorm'
import { LoginPendingTasksAdmin } from '@entity/LoginPendingTasksAdmin'

@EntityRepository(LoginPendingTasksAdmin)
export class LoginPendingTasksAdminRepository extends Repository<LoginPendingTasksAdmin> {}
