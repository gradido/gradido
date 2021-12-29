import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToOne } from 'typeorm'
import { User } from '../User'

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

  @OneToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'state_user_id' })
  user: User
}
