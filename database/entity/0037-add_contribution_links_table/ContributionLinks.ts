import Decimal from 'decimal.js-light'
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { DecimalTransformer } from '../../src/typeorm/DecimalTransformer'

export enum CycleTypes {
  ONCE = 1,
  HOUR = 2,
  TWOHOURS = 3,
  FOURHOURS = 4,
  EIGHTHOURS = 5,
  HALFDAY = 6,
  DAY = 7,
  TWODAYS = 8,
  THREEDAYS = 9,
  FOURDAYS = 10,
  FIVEDAYS = 11,
  SIXDAYS = 12,
  WEEK = 13,
  TWOWEEKS = 14,
  MONTH = 15,
  TWOMONTH = 16,
  QUARTER = 17,
  HALFYEAR = 18,
  YEAR = 19,
}

@Entity('contribution_links')
export class ContributionLinks extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ length: 100, nullable: false, collation: 'utf8mb4_unicode_ci' })
  name: string

  @Column({ length: 255, nullable: false, collation: 'utf8mb4_unicode_ci' })
  description: string

  @Column({ name: 'valid_from', type: 'datetime', nullable: true, default: null })
  validFrom: Date | null

  @Column({ name: 'valid_to', type: 'datetime', nullable: true, default: null })
  validTo: Date | null

  @Column({
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: false,
    transformer: DecimalTransformer,
  })
  amount: Decimal

  @Column({ name: 'cycle', unsigned: true, nullable: false })
  cycle: number

  @Column({ name: 'max_per_cycle', unsigned: true, nullable: false, default: 1 })
  maxPerCycle: number

  @Column({
    name: 'max_amount_per_month',
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: true,
    default: null,
    transformer: DecimalTransformer,
  })
  maxAmountPerMonth: Decimal

  @Column({
    name: 'total_max_count_of_contribution',
    unsigned: true,
    nullable: true,
    default: null,
  })
  totalMaxCountOfContribution: number | null

  @Column({
    name: 'max_account_balance',
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: true,
    default: null,
    transformer: DecimalTransformer,
  })
  maxAccountBalance: Decimal

  @Column({
    name: 'min_gap_hours',
    unsigned: true,
    nullable: true,
    default: null,
  })
  minGapHours: number | null

  @Column({ name: 'created_at', type: 'datetime', nullable: true, default: null })
  createdAt: Date | null

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true, default: null })
  deletedAt: Date | null

  @Column({ length: 24, nullable: true, collation: 'utf8mb4_unicode_ci' })
  code: string

  @Column({ name: 'link_enabled', type: 'boolean', nullable: true, default: null })
  linkEnabled: boolean | null
}
