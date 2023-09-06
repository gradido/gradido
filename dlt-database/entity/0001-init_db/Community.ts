import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  OneToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm'
import { Account } from './Account'
import { TransactionRecipe } from './TransactionRecipe'

@Entity('communities')
export class Community {
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

  @CreateDateColumn({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt: Date

  @Column({ name: 'confirmed_at', type: 'datetime', nullable: true })
  confirmedAt?: Date

  @ManyToMany(() => Account, (account) => account.accountCommunities)
  @JoinTable({
    name: 'accounts_communities',
    joinColumn: { name: 'community_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'account_id', referencedColumnName: 'id' },
  })
  communityAccounts: Account[]

  @OneToMany(() => TransactionRecipe, (recipe) => recipe.senderCommunity)
  transactionRecipesSender?: TransactionRecipe[]

  @OneToMany(() => TransactionRecipe, (recipe) => recipe.recipientCommunity)
  transactionRecipesRecipient?: TransactionRecipe[]
}
