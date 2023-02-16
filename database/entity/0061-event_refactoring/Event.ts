import { Contribution } from '@entity/Contribution'
import { ContributionMessage } from '@entity/ContributionMessage'
import { User } from '@entity/User'
import Decimal from 'decimal.js-light'
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, Transaction } from 'typeorm'
import { DecimalTransformer } from '../../src/typeorm/DecimalTransformer'

@Entity('event')
// TODO tablename event_protocol
export class Event extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ length: 100, nullable: false, collation: 'utf8mb4_unicode_ci' })
  type: string

  // TODO proper field type
  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  // TODO field name user_id
  // @Column({ name: 'affected_user_id', unsigned: true, nullable: false })
  // affectedUserId: number

  @ManyToOne(() => User)
  @JoinColumn({ name: 'affected_user_id', referencedColumnName: 'id' })
  affectedUser: User | null

  // TODO new column
  // TODO potentially save actingRole aswell
  // @Column({ name: 'acting_user_id', unsigned: true, nullable: false })
  // actingUserId: number

  @ManyToOne(() => User)
  @JoinColumn({ name: 'acting_user_id', referencedColumnName: 'id' })
  actingUser: User | null

  // TODO rename column x_user_id
  // @Column({ name: 'involved_user_id', type: 'int', unsigned: true, nullable: true })
  // involvedUserId: number | null

  @ManyToOne(() => User)
  @JoinColumn({ name: 'involved_user_id', referencedColumnName: 'id' })
  involvedUser: User | null

  // TODO drop column xCommunityId

  // TODO rename column transaction_id
  // @Column({ name: 'involved_transaction_id', type: 'int', unsigned: true, nullable: true })
  // involvedTransactionId: number | null

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: 'involved_transaction_id', referencedColumnName: 'id' })
  involvedTransaction: Transaction | null

  // TODO rename column contribution_id
  // @Column({ name: 'involved_contribution_id', type: 'int', unsigned: true, nullable: true })
  // involvedContributionId: number | null

  @ManyToOne(() => Contribution)
  @JoinColumn({ name: 'involved_contribution_id', referencedColumnName: 'id' })
  involvedContribution: Contribution | null

  // TODO move column
  // TODO rename column message_id
  // TEST do we need the Id field definition?
  // @Column({ name: 'involved_contribution_message_id', type: 'int', unsigned: true, nullable: true })
  // involvedContributionMessageId: number | null

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
