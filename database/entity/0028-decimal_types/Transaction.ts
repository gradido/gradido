import { Decimal } from 'decimal.js-light'
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { DecimalTransformer } from '../../src/typeorm/DecimalTransformer'

@Entity('transactions')
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'user_id', unsigned: true, nullable: false })
  userId: number

  @Column({ type: 'int', unsigned: true, nullable: true, default: null })
  previous: number | null

  @Column({ name: 'type_id', unsigned: true, nullable: false })
  typeId: number

  @Column({
    name: 'dec_amount',
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: false,
    transformer: DecimalTransformer,
  })
  decAmount: Decimal

  @Column({
    name: 'dec_balance',
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: false,
    transformer: DecimalTransformer,
  })
  decBalance: Decimal

  @Column({
    name: 'balance_date',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  balanceDate: Date

  @Column({
    name: 'dec_decay',
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: false,
    transformer: DecimalTransformer,
  })
  decDecay: Decimal

  @Column({
    name: 'decay_start',
    type: 'datetime',
    nullable: true,
    default: null,
  })
  decayStart: Date | null

  @Column({ type: 'bigint', nullable: false })
  amount: BigInt

  @Column({ length: 255, nullable: false, collation: 'utf8mb4_unicode_ci' })
  memo: string

  @Column({
    name: 'send_sender_final_balance',
    type: 'bigint',
    nullable: true,
    default: null,
  })
  sendSenderFinalBalance: BigInt | null

  @Column({ name: 'balance', type: 'bigint', default: 0 })
  balance: BigInt

  @Column({ name: 'creation_date', type: 'datetime', nullable: true, default: null })
  creationDate: Date

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
    name: 'temp_dec_send_sender_final_balance',
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: true,
    default: null,
    transformer: DecimalTransformer,
  })
  tempDecSendSenderFinalBalance: Decimal

  @Column({
    name: 'temp_dec_diff_send_sender_final_balance',
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: true,
    default: null,
    transformer: DecimalTransformer,
  })
  tempDecDiffSendSenderFinalBalance: Decimal

  @Column({
    name: 'temp_dec_old_balance',
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: true,
    default: null,
    transformer: DecimalTransformer,
  })
  tempDecOldBalance: Decimal

  @Column({
    name: 'temp_dec_diff_balance',
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: true,
    default: null,
    transformer: DecimalTransformer,
  })
  tempDecDiffBalance: Decimal
}
