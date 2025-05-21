import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Transaction } from './Transaction'

@Entity('dlt_transactions', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class DltTransaction extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'transactions_id', type: 'int', unsigned: true, nullable: false })
  transactionId: number

  @Column({
    name: 'message_id',
    type: 'varchar',
    length: 64,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  messageId: string

  @Column({ name: 'verified', type: 'bool', nullable: false, default: false })
  verified: boolean

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP(3)',
    nullable: false,
  })
  createdAt: Date

  @Column({ name: 'verified_at', type: 'datetime', nullable: true, default: null })
  verifiedAt: Date | null

  @OneToOne(
    () => Transaction,
    (transaction) => transaction.dltTransaction,
  )
  @JoinColumn({ name: 'transactions_id' })
  transaction?: Transaction | null
}
