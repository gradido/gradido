import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm'
import { Transaction } from '../Transaction'

@Entity('transaction_send_coins')
export class TransactionSendCoin extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'transaction_id' })
  transactionId: number

  @Column({ name: 'sender_public_key', type: 'binary', length: 32 })
  senderPublic: Buffer

  @Column({ name: 'state_user_id' })
  userId: number

  @Column({ name: 'receiver_public_key', type: 'binary', length: 32 })
  recipiantPublic: Buffer

  @Column({ name: 'receiver_user_id' })
  recipiantUserId: number

  @Column()
  amount: number

  @Column({ name: 'sender_final_balance' })
  senderFinalBalance: number

  @OneToOne(() => Transaction)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction
}
