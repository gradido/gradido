import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('transactions')
export class Transaction extends BaseEntity {
  // TODO the id is defined as bigint(20) - there might be problems with that: https://github.com/typeorm/typeorm/issues/2400
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'transaction_type_id', unsigned: true, nullable: false })
  transactionTypeId: number

  @Column({ name: 'user_id', unsigned: true, nullable: false })
  userId: number

  @Column({ type: 'bigint', nullable: false })
  amount: BigInt

  @Column({ name: 'tx_hash', type: 'binary', length: 48, default: null, nullable: true })
  txHash: Buffer

  @Column({ length: 255, nullable: false, collation: 'utf8mb4_unicode_ci' })
  memo: string

  @Column({ type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  received: Date

  @Column({ type: 'binary', length: 64, nullable: true, default: null })
  signature: Buffer

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

  @Column({ name: 'creation_date', type: 'timestamp', nullable: true, default: null })
  creationDate: Date

  @Column({
    name: 'send_receiver_public_key',
    type: 'binary',
    length: 32,
    nullable: true,
    default: null,
  })
  sendReceiverPublicKey: Buffer | null

  @Column({
    name: 'send_receiver_user_id',
    type: 'int',
    unsigned: true,
    nullable: true,
    default: null,
  })
  sendReceiverUserId?: number | null

  @Column({
    name: 'send_sender_final_balance',
    type: 'bigint',
    nullable: true,
    default: null,
  })
  sendSenderFinalBalance: BigInt | null
}
