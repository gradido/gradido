import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('login_pending_tasks_admin')
export class LoginPendingTasksAdmin extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ unsigned: true, nullable: false })
  userId: number

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created: Date

  @Column({ type: 'datetime', nullable: false })
  date: Date

  @Column({ length: 256, nullable: true, default: null })
  memo: string

  @Column({ type: 'bigint', nullable: false })
  amount: BigInt

  @Column()
  moderator: number
}
