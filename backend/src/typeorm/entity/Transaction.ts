import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm'
import { TransactionCreation } from './TransactionCreation'
import { TransactionSendCoin } from './TransactionSendCoin'

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
  received: Date

  @Column({ name: 'blockchain_type_id' })
  blockchainTypeId: number

  @OneToOne(() => TransactionSendCoin, (transactionSendCoin) => transactionSendCoin.transaction)
  transactionSendCoin: TransactionSendCoin

  @OneToOne(() => TransactionCreation, (transactionCreation) => transactionCreation.transaction)
  transactionCreation: TransactionCreation

  static async findByTransactionTypeId(transactionTypeId: number): Promise<Transaction[]> {
    return this.createQueryBuilder('transaction')
      .where('transaction.transactionTypeId = :transactionTypeId', {
        transactionTypeId: transactionTypeId,
      })
      .getMany()
  }

  static async getDecayStartBlock(): Promise<Transaction | undefined> {
    return this.createQueryBuilder('transaction')
      .where('transaction.transactionTypeId = :transactionTypeId', { transactionTypeId: 9 })
      .orderBy('received', 'ASC')
      .getOne()
  }
}
