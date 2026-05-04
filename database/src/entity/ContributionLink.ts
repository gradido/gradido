import { GradidoUnit } from 'shared'
import { BaseEntity, Column, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { GradidoUnitTransformer } from './transformer/GradidoUnitTransformer'

@Entity('contribution_links')
export class ContributionLink extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ type: 'varchar', length: 100, nullable: false, collation: 'utf8mb4_unicode_ci' })
  name: string

  @Column({ type: 'varchar', length: 512, nullable: false, collation: 'utf8mb4_unicode_ci' })
  memo: string

  @Column({ name: 'valid_from', type: 'datetime', nullable: false })
  validFrom: Date

  @Column({ name: 'valid_to', type: 'datetime', nullable: true, default: null })
  validTo: Date | null

  @Column({
    name: 'amount_gdd4',
    type: 'bigint',
    nullable: false,
    transformer: GradidoUnitTransformer,
  })
  amount: GradidoUnit

  @Column({ type: 'varchar', length: 12, nullable: false, collation: 'utf8mb4_unicode_ci' })
  cycle: string

  @Column({ name: 'max_per_cycle', type: 'int', unsigned: true, nullable: false, default: 1 })
  maxPerCycle: number

  @Column({
    name: 'max_amount_per_month_gdd4',
    type: 'bigint',
    nullable: true,
    default: null,
    transformer: GradidoUnitTransformer,
  })
  maxAmountPerMonth: GradidoUnit | null

  @Column({
    name: 'total_max_count_of_contribution',
    type: 'int',
    unsigned: true,
    nullable: true,
    default: null,
  })
  totalMaxCountOfContribution: number | null

  @Column({
    name: 'max_account_balance_gdd4',
    type: 'bigint',
    nullable: true,
    default: null,
    transformer: GradidoUnitTransformer,
  })
  maxAccountBalance: GradidoUnit | null

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

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime' })
  deletedAt: Date | null

  @Column({ type: 'varchar', length: 24, nullable: false, collation: 'utf8mb4_unicode_ci' })
  code: string

  @Column({ name: 'link_enabled', type: 'boolean', default: true })
  linkEnabled: boolean
}
