import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm'
import { Decimal } from 'decimal.js-light'

import { DecimalTransformer } from '../../src/typeorm/DecimalTransformer'
import { Account } from './Account'
import { Community } from './Community'
import { ConfirmedTransaction } from './ConfirmedTransaction'

@Entity('transaction_drafts')
export class TransactionDraft {
  @PrimaryGeneratedColumn('increment', { unsigned: true, type: 'bigint' })
  id: number

  @Column({ name: 'iota_message_id', type: 'binary', length: 32, nullable: true })
  iotaMessageId?: Buffer

  @ManyToOne(() => Account, (account) => account.transactionDraftsSigning)
  @JoinColumn({ name: 'signing_account_id' })
  signingAccount: Account

  @Column({ name: 'signing_account_id', type: 'int', unsigned: true })
  signingAccountId: number

  @ManyToOne(() => Account, (account) => account.transactionDraftsRecipient)
  @JoinColumn({ name: 'recipient_account_id' })
  recipientAccount?: Account

  @Column({ name: 'recipient_account_id', type: 'int', unsigned: true, nullable: true })
  recipientAccountId?: number

  @ManyToOne(() => Community, (community) => community.transactionDraftsSender)
  @JoinColumn({ name: 'sender_community_id' })
  senderCommunity: Community

  @Column({ name: 'sender_community_id', type: 'int', unsigned: true })
  senderCommunityId: number

  @ManyToOne(() => Community, (community) => community.transactionDraftsRecipient)
  @JoinColumn({ name: 'recipient_community_id' })
  recipientCommunity?: Community

  @Column({ name: 'sender_community_id', type: 'int', unsigned: true, nullable: true })
  recipientCommunityId?: number

  @Column({
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: true,
    transformer: DecimalTransformer,
  })
  amount?: Decimal

  @Column({ type: 'tinyint' })
  type: number

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date

  @Column({ name: 'body_bytes', type: 'blob' })
  bodyBytes: Buffer

  @Column({ type: 'binary', length: 64 })
  signature: Buffer

  @Column({ name: 'protocol_version', type: 'int', default: 1 })
  protocolVersion: number

  @OneToOne(() => ConfirmedTransaction, (transaction) => transaction.transactionDraft)
  confirmedTransaction?: ConfirmedTransaction
}
