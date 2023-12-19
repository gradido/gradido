import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  BaseEntity,
} from 'typeorm'
import { Decimal } from 'decimal.js-light'

import { DecimalTransformer } from '../../src/typeorm/DecimalTransformer'
import { Account } from '../Account'
import { Community } from '../Community'

@Entity('transactions')
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true, type: 'bigint' })
  id: number

  @Column({ name: 'iota_message_id', type: 'binary', length: 32, nullable: true })
  iotaMessageId?: Buffer

  @Column({ name: 'backend_transaction_id', type: 'bigint', unsigned: true, nullable: true })
  backendTransactionId?: number

  @OneToOne(() => Transaction)
  // eslint-disable-next-line no-use-before-define
  paringTransaction?: Transaction

  @Column({ name: 'paring_transaction_id', type: 'bigint', unsigned: true, nullable: true })
  paringTransactionId?: number

  // if transaction has a sender than it is also the sender account
  @ManyToOne(() => Account, (account) => account.transactionSigning)
  @JoinColumn({ name: 'signing_account_id' })
  signingAccount?: Account

  @Column({ name: 'signing_account_id', type: 'int', unsigned: true, nullable: true })
  signingAccountId?: number

  @ManyToOne(() => Account, (account) => account.transactionRecipient)
  @JoinColumn({ name: 'recipient_account_id' })
  recipientAccount?: Account

  @Column({ name: 'recipient_account_id', type: 'int', unsigned: true, nullable: true })
  recipientAccountId?: number

  @ManyToOne(() => Community, (community) => community.transactions, {
    eager: true,
  })
  @JoinColumn({ name: 'community_id' })
  community: Community

  @Column({ name: 'community_id', type: 'int', unsigned: true })
  communityId: number

  @ManyToOne(() => Community, (community) => community.friendCommunitiesTransactions)
  @JoinColumn({ name: 'other_community_id' })
  otherCommunity?: Community

  @Column({ name: 'other_community_id', type: 'int', unsigned: true, nullable: true })
  otherCommunityId?: number

  @Column({
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: true,
    transformer: DecimalTransformer,
  })
  amount?: Decimal

  // account balance for sender based on creation date
  @Column({
    name: 'account_balance_on_creation',
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: true,
    transformer: DecimalTransformer,
  })
  accountBalanceOnCreation?: Decimal

  @Column({ type: 'tinyint' })
  type: number

  @Column({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date

  @Column({ name: 'body_bytes', type: 'blob' })
  bodyBytes: Buffer

  @Column({ type: 'binary', length: 64, unique: true })
  signature: Buffer

  @Column({ name: 'protocol_version', type: 'varchar', length: 255, default: '1' })
  protocolVersion: string

  @Column({ type: 'bigint', nullable: true })
  nr?: number

  @Column({ name: 'running_hash', type: 'binary', length: 48, nullable: true })
  runningHash?: Buffer

  // account balance for sender based on confirmation date (iota milestone)
  @Column({
    name: 'account_balance_on_confirmation',
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: true,
    transformer: DecimalTransformer,
  })
  accountBalanceOnConfirmation?: Decimal

  @Column({ name: 'iota_milestone', type: 'bigint', nullable: true })
  iotaMilestone?: number

  // use timestamp from iota milestone which is only in seconds precision, so no need to use 3 Bytes extra here
  @Column({ name: 'confirmed_at', type: 'datetime', nullable: true })
  confirmedAt?: Date
}
