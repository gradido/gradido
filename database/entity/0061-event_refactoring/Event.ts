import { Contribution } from '../Contribution'
import { ContributionMessage } from '../ContributionMessage'
import { User } from '../User'
import { Transaction } from '../Transaction'
import Decimal from 'decimal.js-light'
import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { DecimalTransformer } from '../../src/typeorm/DecimalTransformer'

@Entity('events')
export class Event extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ length: 100, nullable: false, collation: 'utf8mb4_unicode_ci' })
  type: string

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP()',
    nullable: false,
  })
  createdAt: Date

  @Column({ name: 'affected_user_id', unsigned: true, nullable: false })
  affectedUserId: number

  @ManyToOne(() => User)
  @JoinColumn({ name: 'affected_user_id', referencedColumnName: 'id' })
  affectedUser: User

  @Column({ name: 'acting_user_id', unsigned: true, nullable: false })
  actingUserId: number

  @ManyToOne(() => User)
  @JoinColumn({ name: 'acting_user_id', referencedColumnName: 'id' })
  actingUser: User

  @Column({ name: 'involved_user_id', type: 'int', unsigned: true, nullable: true })
  involvedUserId: number | null

  @ManyToOne(() => User)
  @JoinColumn({ name: 'involved_user_id', referencedColumnName: 'id' })
  involvedUser: User | null

  @Column({ name: 'involved_transaction_id', type: 'int', unsigned: true, nullable: true })
  involvedTransactionId: number | null

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: 'involved_transaction_id', referencedColumnName: 'id' })
  involvedTransaction: Transaction | null

  @Column({ name: 'involved_contribution_id', type: 'int', unsigned: true, nullable: true })
  involvedContributionId: number | null

  @ManyToOne(() => Contribution)
  @JoinColumn({ name: 'involved_contribution_id', referencedColumnName: 'id' })
  involvedContribution: Contribution | null

  @Column({ name: 'involved_contribution_message_id', type: 'int', unsigned: true, nullable: true })
  involvedContributionMessageId: number | null

  @ManyToOne(() => ContributionMessage)
  @JoinColumn({ name: 'involved_contribution_message_id', referencedColumnName: 'id' })
  involvedContributionMessage: ContributionMessage | null

  @Column({
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: true,
    transformer: DecimalTransformer,
  })
  amount: Decimal | null
}
