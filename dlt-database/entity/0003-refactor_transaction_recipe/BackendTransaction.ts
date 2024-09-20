import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, JoinColumn } from 'typeorm'
import { Decimal } from 'decimal.js-light'

import { DecimalTransformer } from '../../src/typeorm/DecimalTransformer'
// BackendTransaction was removed in newer migrations, so only the version from this folder can be linked
import { Transaction } from './Transaction'

@Entity('backend_transactions')
export class BackendTransaction extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true, type: 'bigint' })
  id: number

  @Column({ name: 'backend_transaction_id', type: 'bigint', unsigned: true, unique: true })
  backendTransactionId: number

  @ManyToOne(() => Transaction, (transaction) => transaction.backendTransactions)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction

  @Column({ name: 'transaction_id', type: 'bigint', unsigned: true })
  transactionId: number

  @Column({ name: 'type_id', unsigned: true, nullable: false })
  typeId: number

  // account balance based on creation date
  @Column({
    name: 'balance',
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: true,
    transformer: DecimalTransformer,
  })
  balance?: Decimal

  @Column({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date

  // use timestamp from iota milestone which is only in seconds precision, so no need to use 3 Bytes extra here
  @Column({ name: 'confirmed_at', type: 'datetime', nullable: true })
  confirmedAt?: Date

  @Column({ name: 'verifiedOnBackend', type: 'tinyint', default: false })
  verifiedOnBackend: boolean
}
