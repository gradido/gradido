import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Decimal } from 'decimal.js-light'

import { DecimalTransformer } from '../../src/typeorm/DecimalTransformer'
import { Account } from './Account'
import { TransactionDraft } from './TransactionDraft'

@Entity('confirmed_transactions')
export class ConfirmedTransaction {
  @PrimaryGeneratedColumn('increment', { unsigned: true, type: 'bigint' })
  id: number

  @ManyToOne(() => TransactionDraft, (draft) => draft.confirmedTransactions)
  @JoinColumn({ name: 'transaction_draft_id' })
  transactionDraft: TransactionDraft

  @Column({ name: 'transaction_draft_id', type: 'int', unsigned: true })
  transactionDraftId: number

  @Column({ type: 'bigint' })
  nr: number

  @Column({ type: 'binary', length: 48 })
  runningHash: Buffer

  @ManyToOne(() => Account, (account) => account.confirmedTransactions)
  @JoinColumn({ name: 'account_id' })
  account: Account

  @Column({
    name: 'account_balance',
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: false,
    default: 0,
    transformer: DecimalTransformer,
  })
  accountBalance: Decimal

  @Column({ name: 'iota_milestone', type: 'bigint' })
  iotaMilestone: number

  @CreateDateColumn({ name: 'confirmed_at', type: 'datetime' })
  confirmedAt: Date
}
