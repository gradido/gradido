import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('state_balances')
export class Balance extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'state_user_id' })
  userId: number

  @Column({ type: 'datetime' })
  modified: Date

  @Column({ name: 'record_date', type: 'datetime' })
  recordDate: Date

  @Column({ type: 'bigint' })
  amount: number
}
