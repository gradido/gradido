import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  BaseEntity,
} from 'typeorm'
import { User } from '../User'
import { Transaction } from '../Transaction'
import { DecimalTransformer } from '../../src/typeorm/DecimalTransformer'
import { Decimal } from 'decimal.js-light'
import { AccountCommunity } from '../AccountCommunity'

@Entity('accounts')
export class Account extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @ManyToOne(() => User, (user) => user.accounts, { cascade: ['insert', 'update'], eager: true }) // Assuming you have a User entity with 'accounts' relation
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

  @Column({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date

  // use timestamp from iota milestone which is only in seconds precision, so no need to use 3 Bytes extra here
  @Column({ name: 'confirmed_at', type: 'datetime', nullable: true })
  confirmedAt?: Date

  @Column({
    name: 'balance_on_confirmation',
    type: 'decimal',
    precision: 40,
    scale: 20,
    default: 0,
    transformer: DecimalTransformer,
  })
  balanceOnConfirmation: Decimal

  // use timestamp from iota milestone which is only in seconds precision, so no need to use 3 Bytes extra here
  @Column({
    name: 'balance_confirmed_at',
    type: 'datetime',
    nullable: true,
  })
  balanceConfirmedAt: Date

  @Column({
    name: 'balance_on_creation',
    type: 'decimal',
    precision: 40,
    scale: 20,
    default: 0,
    transformer: DecimalTransformer,
  })
  balanceOnCreation: Decimal

  @Column({
    name: 'balance_created_at',
    type: 'datetime',
    precision: 3,
  })
  balanceCreatedAt: Date

  @OneToMany(() => AccountCommunity, (accountCommunity) => accountCommunity.account)
  @JoinColumn({ name: 'account_id' })
  accountCommunities: AccountCommunity[]

  @OneToMany(() => Transaction, (transaction) => transaction.signingAccount)
  transactionSigning?: Transaction[]

  @OneToMany(() => Transaction, (transaction) => transaction.recipientAccount)
  transactionRecipient?: Transaction[]
}
