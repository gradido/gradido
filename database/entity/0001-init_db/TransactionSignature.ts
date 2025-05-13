import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Transaction } from '../Transaction'

@Entity('transaction_signatures')
export class TransactionSignature extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'transaction_id' })
  transactionId: number

  @Column({ type: 'binary', length: 64, nullable: false })
  signature: Buffer

  @Column({ type: 'binary', length: 32, nullable: false })
  pubkey: Buffer

  @OneToOne(() => Transaction)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction
}
