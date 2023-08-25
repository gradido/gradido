import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm'
import { User } from './User'
import { Community } from './Community'
import { TransactionRecipe } from './TransactionRecipe'
import { ConfirmedTransaction } from './ConfirmedTransaction'

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @ManyToOne(() => User, (user) => user.accounts) // Assuming you have a User entity with 'accounts' relation
  @JoinColumn({ name: 'user_id' })
  user: User

  // if user id is null, account belongs to community gmw or auf
  @Column({ name: 'user_id', type: 'int', unsigned: true, nullable: true })
  userId?: number

  @Column({ name: 'derivation_index', type: 'int', unsigned: true })
  derivationIndex: number

  @Column({ type: 'binary', length: 32, unique: true })
  pubkey: Buffer

  @Column({ type: 'tinyint', unsigned: true })
  type: number

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date

  @Column({ name: 'confirmed_at', type: 'datetime', nullable: true })
  confirmedAt?: Date

  @OneToOne(() => Community, (community) => community.gmwAccount)
  gmwCommunity?: Community

  @OneToOne(() => Community, (community) => community.aufAccount)
  aufCommunity?: Community

  @ManyToMany(() => Community, (community) => community.communityAccounts)
  @JoinTable({
    name: 'accounts_communities',
    joinColumn: { name: 'account_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'community_id', referencedColumnName: 'id' },
  })
  accountCommunities: Community[]

  @OneToMany(() => TransactionRecipe, (recipe) => recipe.signingAccount)
  transactionRecipesSigning?: TransactionRecipe[]

  @OneToMany(() => TransactionRecipe, (recipe) => recipe.recipientAccount)
  transactionRecipesRecipient?: TransactionRecipe[]

  @OneToMany(() => ConfirmedTransaction, (transaction) => transaction.account)
  confirmedTransactions?: ConfirmedTransaction[]
}
