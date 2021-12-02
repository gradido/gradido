import { EntityRepository, Repository } from 'typeorm'
import { LoginPendingTasksAdmin } from '@entity/LoginPendingTasksAdmin'

@EntityRepository(LoginPendingTasksAdmin)
export class PendingCreationRepository extends Repository<LoginPendingTasksAdmin> {}
