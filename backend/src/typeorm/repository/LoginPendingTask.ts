import { EntityRepository, Repository } from 'typeorm'
import { LoginPendingTask } from '@entity/LoginPendingTask'

@EntityRepository(LoginPendingTask)
export class LoginPendingTaskRepository extends Repository<LoginPendingTask> {}
