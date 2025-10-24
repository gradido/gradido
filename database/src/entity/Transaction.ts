/* eslint-disable no-use-before-define */
import { Decimal } from 'decimal.js-light'
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Contribution } from './Contribution'
import { DltTransaction } from './DltTransaction'
import { TransactionLink } from './TransactionLink'
import { DecimalTransformer } from './transformer/DecimalTransformer'

@Entity('transactions')
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ type: 'int', unsigned: true, unique: true, nullable: true, default: null })
  previous: number | null

  @Column({ name: 'type_id', type: 'int', unsigned: true, nullable: false })
  typeId: number

  @Column({
    name: 'transaction_link_id',
    type: 'int',
    unsigned: true,
    nullable: true,
    default: null,
  })
  transactionLinkId?: number | null

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
    precision: 40,
    scale: 20,
    nullable: false,
    transformer: DecimalTransformer,
  })
  balance: Decimal

  @Column({
    name: 'balance_date',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
    nullable: false,
  })
  balanceDate: Date

  @Column({
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: false,
    transformer: DecimalTransformer,
  })
  decay: Decimal

  @Column({
    name: 'decay_start',
    type: 'datetime',
    precision: 3,
    nullable: true,
    default: null,
  })
  decayStart: Date | null

  @Column({ type: 'varchar', length: 512, nullable: false, collation: 'utf8mb4_unicode_ci' })
  memo: string

  @Column({ name: 'creation_date', type: 'datetime', precision: 3, nullable: true, default: null })
  creationDate: Date | null

  @Column({ name: 'user_id', type: 'bigint', unsigned: true, nullable: false })
  userId: number

  @Column({
    name: 'user_community_uuid',
    type: 'varchar',
    length: 36,
    nullable: true,
    collation: 'utf8mb4_unicode_ci',
  })
  userCommunityUuid: string | null

  @Column({
    name: 'user_gradido_id',
    type: 'varchar',
    length: 36,
    nullable: false,
    collation: 'utf8mb4_unicode_ci',
  })
  userGradidoID: string

  @Column({
    name: 'user_name',
    type: 'varchar',
    length: 512,
    nullable: true,
    collation: 'utf8mb4_unicode_ci',
  })
  userName: string | null

  @Column({
    name: 'linked_user_id',
    type: 'int',
    unsigned: true,
    nullable: true,
    default: null,
  })
  linkedUserId?: number | null

  @Column({
    name: 'linked_user_community_uuid',
    type: 'varchar',
    length: 36,
    nullable: true,
    collation: 'utf8mb4_unicode_ci',
  })
  linkedUserCommunityUuid: string | null

  @Column({
    name: 'linked_user_gradido_id',
    type: 'varchar',
    length: 36,
    nullable: true,
    collation: 'utf8mb4_unicode_ci',
  })
  linkedUserGradidoID: string | null

  @Column({
    name: 'linked_user_name',
    type: 'varchar',
    length: 512,
    nullable: true,
    collation: 'utf8mb4_unicode_ci',
  })
  linkedUserName: string | null

  @Column({
    name: 'linked_transaction_id',
    type: 'int',
    unsigned: true,
    nullable: true,
    default: null,
  })
  linkedTransactionId?: number | null

  @OneToOne(
    () => Contribution,
    (contribution) => contribution.transaction,
  )
  @JoinColumn({ name: 'id', referencedColumnName: 'transactionId' })
  contribution?: Contribution | null

  @OneToOne(
    () => DltTransaction,
    (dlt) => dlt.transactionId,
  )
  @JoinColumn({ name: 'id', referencedColumnName: 'transactionId' })
  dltTransaction?: DltTransaction | null

  @OneToOne(() => Transaction)
  @JoinColumn({ name: 'previous' })
  previousTransaction?: Transaction | null

  @ManyToOne(
    () => TransactionLink,
    (transactionLink) => transactionLink.transactions,
  )
  @JoinColumn({ name: 'transaction_link_id' })
  transactionLink?: TransactionLink | null
}
