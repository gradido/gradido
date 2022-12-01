import Decimal from 'decimal.js-light'
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm'
import { DecimalTransformer } from '../../src/typeorm/DecimalTransformer'
import { Contribution } from '../Contribution'

@Entity('transactions')
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'user_id', unsigned: true, nullable: false })
  userId: number

  @Column({ type: 'int', unsigned: true, unique: true, nullable: true, default: null })
  previous: number | null

  @Column({ name: 'type_id', unsigned: true, nullable: false })
  typeId: number

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
    default: () => 'CURRENT_TIMESTAMP',
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
    nullable: true,
    default: null,
  })
  decayStart: Date | null

  @Column({ length: 255, nullable: false, collation: 'utf8mb4_unicode_ci' })
  memo: string

  @Column({ name: 'creation_date', type: 'datetime', nullable: true, default: null })
  creationDate: Date | null

  @Column({
    name: 'linked_user_id',
    type: 'int',
    unsigned: true,
    nullable: true,
    default: null,
  })
  linkedUserId?: number | null

  @Column({
    name: 'linked_transaction_id',
    type: 'int',
    unsigned: true,
    nullable: true,
    default: null,
  })
  linkedTransactionId?: number | null

  @Column({
    name: 'transaction_link_id',
    type: 'int',
    unsigned: true,
    nullable: true,
    default: null,
  })
  transactionLinkId?: number | null

  @OneToOne(() => Contribution, (contribution) => contribution.transaction)
  @JoinColumn({ name: 'id', referencedColumnName: 'transactionId' })
  contribution?: Contribution | null
}
