import { EntityRepository, Repository } from '@dbTools/typeorm'
import { LoginPendingTasksAdmin } from '@entity/LoginPendingTasksAdmin'

@EntityRepository(LoginPendingTasksAdmin)
export class LoginPendingTasksAdminRepository extends Repository<LoginPendingTasksAdmin> {}
