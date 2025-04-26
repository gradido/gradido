import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('transactions')
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'user_id', unsigned: true, nullable: false })
  userId: number

  @Column({ name: 'transaction_id', unsigned: true, nullable: false })
  transactionId: number

  @Column({ name: 'transaction_type_id', unsigned: true, nullable: false })
  transactionTypeId: number

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

  @Column({
    name: 'balance_date',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  balanceDate: Date

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  received: Date

  @Column({ name: 'creation_date', type: 'timestamp', nullable: true, default: null })
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
    name: 'linked_state_user_transaction_id',
    type: 'int',
    unsigned: true,
    nullable: true,
    default: null,
  })
  linkedStateUserTransactionId?: number | null

  @Column({ type: 'binary', length: 64, nullable: true, default: null })
  signature: Buffer

  @Column({ name: 'tx_hash', type: 'binary', length: 48, default: null, nullable: true })
  txHash: Buffer

  @Column({ type: 'binary', length: 32, nullable: true, default: null })
  pubkey: Buffer

  @Column({
    name: 'creation_ident_hash',
    type: 'binary',
    length: 32,
    nullable: true,
    default: null,
  })
  creationIdentHash: Buffer
}
