import { Decimal } from 'decimal.js-light'
import {
  BaseEntity,
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { DltTransaction } from './DltTransaction'
import { Transaction } from './Transaction'
import { DecimalTransformer } from './transformer/DecimalTransformer'
import { User } from './User'

@Entity('transaction_links')
export class TransactionLink extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ type: 'bigint', unsigned: true, nullable: false })
  userId: number

  @Column({
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: false,
    transformer: DecimalTransformer,
  })
  amount: Decimal

  @Column({
    type: 'decimal',
    name: 'hold_available_amount',
    precision: 40,
    scale: 20,
    nullable: false,
    transformer: DecimalTransformer,
  })
  holdAvailableAmount: Decimal

  @Column({ type: 'varchar', length: 512, nullable: false, collation: 'utf8mb4_unicode_ci' })
  memo: string

  @Column({ type: 'varchar', length: 24, nullable: false, collation: 'utf8mb4_unicode_ci' })
  code: string

  @Column({
    type: 'datetime',
    nullable: false,
  })
  createdAt: Date

  @DeleteDateColumn()
  deletedAt: Date | null

  @Column({
    type: 'datetime',
    nullable: false,
  })
  validUntil: Date

  @Column({
    type: 'datetime',
    nullable: true,
  })
  redeemedAt: Date | null

  @Column({ type: 'int', unsigned: true, nullable: true })
  redeemedBy: number | null

  @OneToOne(
    () => DltTransaction,
    (dlt) => dlt.transactionLinkId,
  )
  @JoinColumn({ name: 'id', referencedColumnName: 'transactionLinkId' })
  dltTransaction?: DltTransaction | null

  @OneToOne(
    () => User,
    (user) => user.transactionLink,
  )
  @JoinColumn({ name: 'userId' })
  user: User

  @OneToMany(
    () => Transaction,
    (transaction) => transaction.transactionLink,
  )
  @JoinColumn({ referencedColumnName: 'transaction_link_id' })
  transactions: Transaction[]
}
