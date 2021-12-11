import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, OneToOne } from 'typeorm'
import { LoginPendingTasksAdmin } from '../LoginPendingTasksAdmin'

@Entity('login_pending_tasks')
export class LoginPendingTask extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'user_id', unsigned: true, nullable: true, default: 0 })
  userId: number

  @Column({ type: 'binary', length: 2048, nullable: false })
  request: Buffer

  @Column({ nullable: false })
  created: Date

  @Column({ nullable: true, default: '2000-01-01 00:00:00' })
  finished: Date

  @Column({ name: 'result_json', length: 65535, default: null, nullable: true })
  resultJson: string

  @Column({ name: 'param_json', length: 65535, default: null, nullable: true })
  paramJson: string

  @Column({ name: 'task_type_id', unsigned: true, nullable: false })
  taskTypeId: number

  @Column({ name: 'child_pending_task_id', unsigned: true, nullable: true, default: 0 })
  childPendingTaskId: number

  @Column({ name: 'parent_pending_task_id', unsigned: true, nullable: true, default: 0 })
  parentPendingTaskId: number

  @OneToOne(
    () => LoginPendingTasksAdmin,
    (loginPendingTasksAdmin: LoginPendingTasksAdmin) => loginPendingTasksAdmin.loginPendingTask,
  )
  loginPendingTasksAdmin: LoginPendingTasksAdmin
}
