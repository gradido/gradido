import { GradidoUnit } from 'shared'
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
import { type DltTransaction as DltTransactionType } from './DltTransaction'
import { type Transaction as TransactionType } from './Transaction'
import { GradidoUnitTransformer } from './transformer/GradidoUnitTransformer'
import { type User as UserType } from './User'

@Entity('transaction_links')
export class TransactionLink extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ type: 'bigint', unsigned: true, nullable: false })
  userId: number

  @Column({
    name: 'amount_gdd4',
    type: 'bigint',
    nullable: false,
    transformer: GradidoUnitTransformer,
  })
  amount: GradidoUnit

  @Column({
    name: 'hold_available_amount_gdd4',
    type: 'bigint',
    nullable: false,
    transformer: GradidoUnitTransformer,
  })
  holdAvailableAmount: GradidoUnit

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
    () => require('./DltTransaction').DltTransaction,
    (dlt: DltTransactionType) => dlt.transactionLinkId,
  )
  @JoinColumn({ name: 'id', referencedColumnName: 'transactionLinkId' })
  dltTransaction?: DltTransactionType | null

  @OneToOne(
    () => require('./User').User,
    (user: UserType) => user.transactionLink,
  )
  @JoinColumn({ name: 'userId' })
  user: UserType

  @OneToMany(
    () => require('./Transaction').Transaction,
    (transaction: TransactionType) => transaction.transactionLink,
  )
  @JoinColumn({ referencedColumnName: 'transaction_link_id' })
  transactions: TransactionType[]
}
