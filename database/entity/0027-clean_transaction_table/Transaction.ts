import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('transactions')
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'user_id', unsigned: true, nullable: false })
  userId: number

  @Column({ name: 'type_id', unsigned: true, nullable: false })
  typeId: number

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
    name: 'linked_transaction_id',
    type: 'int',
    unsigned: true,
    nullable: true,
    default: null,
  })
  linkedTransactionId?: number | null
}
