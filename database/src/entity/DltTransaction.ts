import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { type Transaction as TransactionType } from './Transaction'
import { type TransactionLink as TransactionLinkType } from './TransactionLink'
import { type User as UserType } from './User'

@Entity('dlt_transactions', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class DltTransaction extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'transaction_id', type: 'int', unsigned: true, nullable: true })
  transactionId?: number | null

  @Column({ name: 'user_id', type: 'int', unsigned: true, nullable: true })
  userId?: number | null

  @Column({ name: 'transaction_link_id', type: 'int', unsigned: true, nullable: true })
  transactionLinkId?: number | null

  @Column({ name: 'type_id', type: 'int', unsigned: true, nullable: false })
  typeId: number

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
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
    nullable: false,
  })
  createdAt: Date

  @Column({ name: 'verified_at', type: 'datetime', precision: 3, nullable: true, default: null })
  verifiedAt: Date | null

  @Column({ name: 'error', type: 'text', nullable: true })
  error: string | null

  @OneToOne(
    () => require('./Transaction').Transaction,
    (transaction: TransactionType) => transaction.dltTransaction,
  )
  @JoinColumn({ name: 'transaction_id' })
  transaction?: TransactionType | null

  @OneToOne(
    () => require('./User').User,
    (user: UserType) => user.dltTransaction,
  )
  @JoinColumn({ name: 'user_id' })
  user?: UserType | null

  @OneToOne(
    () => require('./TransactionLink').TransactionLink,
    (transactionLink: TransactionLinkType) => transactionLink.dltTransaction,
  )
  @JoinColumn({ name: 'transaction_link_id' })
  transactionLink?: TransactionLinkType | null
}
