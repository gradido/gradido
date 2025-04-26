import { BaseEntity, Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { TransactionCreation } from './TransactionCreation'
import { TransactionSendCoin } from './TransactionSendCoin'

@Entity('transactions')
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'state_group_id', unsigned: true, default: null })
  stateGroupId: number

  @Column({ name: 'transaction_type_id', unsigned: true, nullable: false })
  transactionTypeId: number

  @Column({ name: 'tx_hash', type: 'binary', length: 48, default: null })
  txHash: Buffer

  @Column({ length: 255, nullable: false, collation: 'utf8mb4_unicode_ci' })
  memo: string

  @Column({ type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  received: Date

  @Column({
    name: 'blockchain_type_id',
    type: 'bigint',
    unsigned: true,
    nullable: false,
    default: 1,
  })
  blockchainTypeId: number

  @OneToOne(
    () => TransactionSendCoin,
    (transactionSendCoin) => transactionSendCoin.transaction,
  )
  transactionSendCoin: TransactionSendCoin

  @OneToOne(
    () => TransactionCreation,
    (transactionCreation) => transactionCreation.transaction,
  )
  transactionCreation: TransactionCreation
}
