import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, Timestamp } from 'typeorm'

@Entity('transactions')
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'transaction_type_id' })
  transactionTypeId: number

  @Column({ name: 'tx_hash', type: 'binary', length: 48 })
  txHash: Buffer

  @Column()
  memo: string

  @Column({ type: 'timestamp' })
  received: Timestamp

  @Column({ name: 'blockchain_type_id' })
  blockchainTypeId: number

}
