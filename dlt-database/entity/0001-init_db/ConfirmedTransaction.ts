import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  BaseEntity,
} from 'typeorm'
import { Decimal } from 'decimal.js-light'

import { DecimalTransformer } from '../../src/typeorm/DecimalTransformer'
import { Account } from './Account'
import { TransactionRecipe } from './TransactionRecipe'

@Entity('confirmed_transactions')
export class ConfirmedTransaction extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true, type: 'bigint' })
  id: number

  @OneToOne(() => TransactionRecipe, (recipe) => recipe.confirmedTransaction)
  @JoinColumn({ name: 'transaction_recipe_id' })
  transactionRecipe: TransactionRecipe

  @Column({ name: 'transaction_recipe_id', type: 'int', unsigned: true })
  transactionRecipeId: number

  @Column({ type: 'bigint' })
  nr: number

  @Column({ type: 'binary', length: 48 })
  runningHash: Buffer

  @ManyToOne(() => Account, (account) => account.confirmedTransactions)
  @JoinColumn({ name: 'account_id' })
  account: Account

  @Column({ name: 'account_id', type: 'int', unsigned: true })
  accountId: number

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

  @Column({ name: 'confirmed_at', type: 'datetime', precision: 3 })
  confirmedAt: Date
}
