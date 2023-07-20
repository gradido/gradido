import Decimal from 'decimal.js-light'
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm'
import { DecimalTransformer } from '../../src/typeorm/DecimalTransformer'
import { Transaction } from '../Transaction'

@Entity('dlt_transactions', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class DltTransaction extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'transaction_id', type: 'int', unsigned: true, nullable: false })
  transactionId: number

  @Column({ name: 'message_id', length: 40, nullable: false, collation: 'utf8mb4_unicode_ci' })
  messageId: string

  @Column({ name: 'verified', type: 'bool', nullable: false, default: false })
  verified: boolean

  @Column({
    name: 'community_balance',
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: true,
    transformer: DecimalTransformer,
  })
  communityBalance: Decimal | null

  @Column({
    name: 'community_balance_date',
    type: 'datetime',
    nullable: true,
  })
  CommunityBalanceDate: Date | null

  @Column({
    name: 'community_balance_decay',
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: true,
    transformer: DecimalTransformer,
  })
  CommunityBalanceDecay: Decimal | null

  @Column({
    name: 'community_balance_decay_start',
    type: 'datetime',
    nullable: true,
    default: null,
  })
  CommunityBalanceDecayStart: Date | null

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP(3)', nullable: false })
  createdAt: Date

  @Column({ name: 'verified_at', nullable: true, default: null, type: 'datetime' })
  verifiedAt: Date | null

  @OneToOne(() => Transaction, (transaction) => transaction.dltTransaction)
  @JoinColumn({ name: 'transaction_id' })
  transaction?: Transaction | null
}
