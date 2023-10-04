import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BaseEntity } from 'typeorm'

import { Account } from '../Account'
import { Community } from '../Community'

@Entity('accounts_communities')
export class AccountCommunity extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @ManyToOne(() => Account, (account) => account.accountCommunities)
  @JoinColumn({ name: 'account_id' })
  account: Account

  @Column({ name: 'account_id', type: 'int', unsigned: true })
  accountId: number

  @ManyToOne(() => Community, (community) => community.accountCommunities)
  @JoinColumn({ name: 'community_id' })
  community: Community

  @Column({ name: 'community_id', type: 'int', unsigned: true })
  communityId: number

  @Column({ name: 'valid_from', type: 'datetime', precision: 3 })
  validFrom: Date

  @Column({ name: 'valid_to', type: 'datetime', precision: 3, nullable: true })
  validTo?: Date
}
