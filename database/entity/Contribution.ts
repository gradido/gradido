import { Decimal } from 'decimal.js-light'
import {
  BaseEntity,
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { DecimalTransformer } from '../src/typeorm/DecimalTransformer'
import { ContributionMessage } from './ContributionMessage'
import { Transaction } from './Transaction'
import { User } from './User'

@Entity('contributions')
export class Contribution extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ type: 'bigint', unsigned: true, nullable: false, name: 'user_id' })
  userId: number

  @ManyToOne(
    () => User,
    (user) => user.contributions,
  )
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date

  @Column({ type: 'datetime', name: 'resubmission_at', default: null, nullable: true })
  resubmissionAt: Date | null

  @Column({ type: 'datetime', nullable: false, name: 'contribution_date' })
  contributionDate: Date

  @Column({ type: 'varchar', length: 255, nullable: false, collation: 'utf8mb4_unicode_ci' })
  memo: string

  @Column({
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: false,
    transformer: DecimalTransformer,
  })
  amount: Decimal

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'moderator_id' })
  moderatorId: number

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'contribution_link_id' })
  contributionLinkId: number

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'confirmed_by' })
  confirmedBy: number

  @Column({ type: 'datetime', nullable: true, name: 'confirmed_at' })
  confirmedAt: Date

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'denied_by' })
  deniedBy: number

  @Column({ type: 'datetime', nullable: true, name: 'denied_at' })
  deniedAt: Date

  @Column({
    name: 'contribution_type',
    type: 'varchar',
    length: 12,
    nullable: false,
    collation: 'utf8mb4_unicode_ci',
  })
  contributionType: string

  @Column({
    name: 'contribution_status',
    type: 'varchar',
    length: 12,
    nullable: false,
    collation: 'utf8mb4_unicode_ci',
  })
  contributionStatus: string

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'transaction_id' })
  transactionId: number

  @Column({ type: 'datetime', nullable: true, name: 'updated_at' })
  updatedAt: Date

  @Column({ type: 'bigint', nullable: true, unsigned: true, name: 'updated_by' })
  updatedBy: number | null

  @DeleteDateColumn({ type: 'datetime', name: 'deleted_at' })
  deletedAt: Date | null

  @DeleteDateColumn({ type: 'bigint', unsigned: true, nullable: true, name: 'deleted_by' })
  deletedBy: number

  @OneToMany(
    () => ContributionMessage,
    (message) => message.contribution,
  )
  @JoinColumn({ name: 'contribution_id' })
  messages?: ContributionMessage[]

  @OneToOne(
    () => Transaction,
    (transaction) => transaction.contribution,
  )
  @JoinColumn({ name: 'transaction_id' })
  transaction?: Transaction | null
}
