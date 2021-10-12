import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('state_user_transactions')
export class UserTransaction extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'state_user_id' })
  userId: number

  @Column({ name: 'transaction_id' })
  transactionId: number

  @Column({ name: 'transaction_type_id' })
  transactionTypeId: number

  @Column({ name: 'balance', type: 'bigint' })
  balance: number

  @Column({ name: 'balance_date', type: 'timestamp' })
  balanceDate: Date
}
