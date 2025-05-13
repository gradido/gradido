import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Transaction } from '../Transaction'

@Entity('transaction_creations')
export class TransactionCreation extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'transaction_id' })
  transactionId: number

  @Column({ name: 'state_user_id' })
  userId: number

  @Column()
  amount: number

  @Column({ name: 'target_date', type: 'timestamp' })
  targetDate: Date

  @OneToOne(() => Transaction)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction
}
