import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm'
import { User } from '../User'
import { TransactionRecipe } from '../TransactionRecipe'
import { ConfirmedTransaction } from '../ConfirmedTransaction'
import { DecimalTransformer } from '../../src/typeorm/DecimalTransformer'
import { Decimal } from 'decimal.js-light'
import { AccountCommunity } from '../AccountCommunity'

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @ManyToOne(() => User, (user) => user.accounts) // Assuming you have a User entity with 'accounts' relation
  @JoinColumn({ name: 'user_id' })
  user?: User

  // if user id is null, account belongs to community gmw or auf
  @Column({ name: 'user_id', type: 'int', unsigned: true, nullable: true })
  userId?: number

  @Column({ name: 'derivation_index', type: 'int', unsigned: true })
  derivationIndex: number

  @Column({ name: 'derive2_pubkey', type: 'binary', length: 32, unique: true })
  derive2Pubkey: Buffer

  @Column({ type: 'tinyint', unsigned: true })
  type: number

  @CreateDateColumn({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt: Date

  @Column({ name: 'confirmed_at', type: 'datetime', nullable: true })
  confirmedAt?: Date

  @Column({
    type: 'decimal',
    precision: 40,
    scale: 20,
    default: 0,
    transformer: DecimalTransformer,
  })
  balance: Decimal

  @Column({
    name: 'balance_date',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  balanceDate: Date

  @OneToMany(() => AccountCommunity, (accountCommunity) => accountCommunity.account)
  @JoinColumn({ name: 'account_id' })
  accountCommunities: AccountCommunity[]

  @OneToMany(() => TransactionRecipe, (recipe) => recipe.signingAccount)
  transactionRecipesSigning?: TransactionRecipe[]

  @OneToMany(() => TransactionRecipe, (recipe) => recipe.recipientAccount)
  transactionRecipesRecipient?: TransactionRecipe[]

  @OneToMany(() => ConfirmedTransaction, (transaction) => transaction.account)
  confirmedTransactions?: ConfirmedTransaction[]
}
