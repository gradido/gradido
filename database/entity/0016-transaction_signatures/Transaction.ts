import { BaseEntity, Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { TransactionCreation } from '../0001-init_db/TransactionCreation'
import { TransactionSendCoin } from '../0001-init_db/TransactionSendCoin'

@Entity('transactions')
export class Transaction extends BaseEntity {
  // TODO the id is defined as bigint(20) - there might be problems with that: https://github.com/typeorm/typeorm/issues/2400
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'transaction_type_id', unsigned: true, nullable: false })
  transactionTypeId: number

  @Column({ name: 'tx_hash', type: 'binary', length: 48, default: null })
  txHash: Buffer

  @Column({ length: 255, nullable: false, collation: 'utf8mb4_unicode_ci' })
  memo: string

  @Column({ type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  received: Date

  @Column({ type: 'binary', length: 64, nullable: true, default: null })
  signature: Buffer

  @Column({ type: 'binary', length: 32, nullable: true, default: null })
  pubkey: Buffer

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
