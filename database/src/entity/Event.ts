import { Decimal } from 'decimal.js-light'
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { type Contribution as ContributionType } from './Contribution'
import { type ContributionLink as ContributionLinkType } from './ContributionLink'
import { type ContributionMessage as ContributionMessageType } from './ContributionMessage'
import { type Transaction as TransactionType } from './Transaction'
import { type TransactionLink as TransactionLinkType } from './TransactionLink'
import { DecimalTransformer } from './transformer/DecimalTransformer'
import { type User as UserType } from './User'

@Entity('events')
export class Event extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ type: 'varchar', length: 100, nullable: false, collation: 'utf8mb4_unicode_ci' })
  type: string

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
    nullable: false,
  })
  createdAt: Date

  @Column({ name: 'affected_user_id', type: 'bigint', unsigned: true, nullable: false })
  affectedUserId: number

  @ManyToOne(() => require('./User').User)
  @JoinColumn({ name: 'affected_user_id', referencedColumnName: 'id' })
  affectedUser: UserType

  @Column({ name: 'acting_user_id', type: 'bigint', unsigned: true, nullable: false })
  actingUserId: number

  @ManyToOne(() => require('./User').User)
  @JoinColumn({ name: 'acting_user_id', referencedColumnName: 'id' })
  actingUser: UserType

  @Column({ name: 'involved_user_id', type: 'bigint', unsigned: true, nullable: true })
  involvedUserId: number | null

  @ManyToOne(() => require('./User').User)
  @JoinColumn({ name: 'involved_user_id', referencedColumnName: 'id' })
  involvedUser: UserType | null

  @Column({ name: 'involved_transaction_id', type: 'bigint', unsigned: true, nullable: true })
  involvedTransactionId: number | null

  @ManyToOne(() => require('./Transaction').Transaction)
  @JoinColumn({ name: 'involved_transaction_id', referencedColumnName: 'id' })
  involvedTransaction: TransactionType | null

  @Column({ name: 'involved_contribution_id', type: 'bigint', unsigned: true, nullable: true })
  involvedContributionId: number | null

  @ManyToOne(() => require('./Contribution').Contribution)
  @JoinColumn({ name: 'involved_contribution_id', referencedColumnName: 'id' })
  involvedContribution: ContributionType | null

  @Column({
    name: 'involved_contribution_message_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  involvedContributionMessageId: number | null

  @ManyToOne(() => require('./ContributionMessage').ContributionMessage)
  @JoinColumn({ name: 'involved_contribution_message_id', referencedColumnName: 'id' })
  involvedContributionMessage: ContributionMessageType | null

  @Column({ name: 'involved_transaction_link_id', type: 'bigint', unsigned: true, nullable: true })
  involvedTransactionLinkId: number | null

  @ManyToOne(() => require('./TransactionLink').TransactionLink)
  @JoinColumn({ name: 'involved_transaction_link_id', referencedColumnName: 'id' })
  involvedTransactionLink: TransactionLinkType | null

  @Column({ name: 'involved_contribution_link_id', type: 'bigint', unsigned: true, nullable: true })
  involvedContributionLinkId: number | null

  @ManyToOne(() => require('./ContributionLink').ContributionLink)
  @JoinColumn({ name: 'involved_contribution_link_id', referencedColumnName: 'id' })
  involvedContributionLink: ContributionLinkType | null

  @Column({
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: true,
    transformer: DecimalTransformer,
  })
  amount: Decimal | null
}
