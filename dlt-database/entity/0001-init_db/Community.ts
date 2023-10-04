import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToOne,
  OneToMany,
  BaseEntity,
} from 'typeorm'
import { Account } from '../Account'
import { TransactionRecipe } from '../TransactionRecipe'
import { AccountCommunity } from '../AccountCommunity'

@Entity('communities')
export class Community extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'iota_topic', collation: 'utf8mb4_unicode_ci' })
  iotaTopic: string

  @Column({ name: 'root_pubkey', type: 'binary', length: 32, unique: true })
  rootPubkey: Buffer

  @Column({ name: 'root_privkey', type: 'binary', length: 32, nullable: true })
  rootPrivkey?: Buffer

  @Column({ name: 'root_chaincode', type: 'binary', length: 32, nullable: true })
  rootChaincode?: Buffer

  @Column({ type: 'tinyint', default: true })
  foreign: boolean

  @Column({ name: 'gmw_account_id', type: 'int', unsigned: true, nullable: true })
  gmwAccountId?: number

  @OneToOne(() => Account)
  @JoinColumn({ name: 'gmw_account_id' })
  gmwAccount?: Account

  @Column({ name: 'auf_account_id', type: 'int', unsigned: true, nullable: true })
  aufAccountId?: number

  @OneToOne(() => Account)
  @JoinColumn({ name: 'auf_account_id' })
  aufAccount?: Account

  @Column({
    name: 'created_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  createdAt: Date

  @Column({ name: 'confirmed_at', type: 'datetime', precision: 3, nullable: true })
  confirmedAt?: Date

  @OneToMany(() => AccountCommunity, (accountCommunity) => accountCommunity.community)
  @JoinColumn({ name: 'community_id' })
  accountCommunities: AccountCommunity[]

  @OneToMany(() => TransactionRecipe, (recipe) => recipe.senderCommunity)
  transactionRecipesSender?: TransactionRecipe[]

  @OneToMany(() => TransactionRecipe, (recipe) => recipe.recipientCommunity)
  transactionRecipesRecipient?: TransactionRecipe[]
}
