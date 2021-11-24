import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Transaction } from './Transaction'

@Entity('transaction_signatures')
export class TransactionSignature extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'transaction_id' })
  transactionId: number

  @Column({ type: 'binary', length: 64 })
  signature: Buffer

  @Column({ type: 'binary', length: 32 })
  pubkey: Buffer

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction
}
