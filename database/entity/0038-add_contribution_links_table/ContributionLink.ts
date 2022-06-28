import Decimal from 'decimal.js-light'
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn } from 'typeorm'
import { DecimalTransformer } from '../../src/typeorm/DecimalTransformer'

@Entity('contribution_links')
export class ContributionLink extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ length: 100, nullable: false, collation: 'utf8mb4_unicode_ci' })
  name: string

  @Column({ length: 255, nullable: false, collation: 'utf8mb4_unicode_ci' })
  memo: string

  @Column({ name: 'valid_from', type: 'datetime', nullable: false })
  validFrom: Date

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

  @Column({ length: 12, nullable: false, collation: 'utf8mb4_unicode_ci' })
  cycle: string

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
  maxAmountPerMonth: Decimal | null

  @Column({
    name: 'total_max_count_of_contribution',
    type: 'int',
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
  maxAccountBalance: Decimal | null

  @Column({
    name: 'min_gap_hours',
    type: 'int',
    unsigned: true,
    nullable: true,
    default: null,
  })
  minGapHours: number | null

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null

  @Column({ length: 24, nullable: false, collation: 'utf8mb4_unicode_ci' })
  code: string

  @Column({ name: 'link_enabled', type: 'boolean', default: true })
  linkEnabled: boolean
}
