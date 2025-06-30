import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm'
import { Transaction } from '../Transaction'

@Entity('dlt_transactions', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class DltTransaction extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'transaction_id', type: 'int', unsigned: true, nullable: false })
  transactionId: number

  @Column({
    name: 'message_id',
    length: 64,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  messageId: string

  @Column({ name: 'verified', type: 'bool', nullable: false, default: false })
  verified: boolean

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP(3)', nullable: false })
  createdAt: Date

  @Column({ name: 'verified_at', nullable: true, default: null, type: 'datetime' })
  verifiedAt: Date | null

  @Column({ name: 'error', type: 'text', nullable: true })
  error: string | null

  @OneToOne(() => Transaction, (transaction) => transaction.dltTransaction)
  @JoinColumn({ name: 'transaction_id' })
  transaction?: Transaction | null
}
