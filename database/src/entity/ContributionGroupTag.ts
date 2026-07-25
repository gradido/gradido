import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'

// Group functions: join between a contribution and a
// group tag. A contribution can carry several tags. No FK constraints (matches the
// crea_records convention) — indices only.
@Index('uniq_contribution_group_tag', ['contributionId', 'groupTagId'], { unique: true })
@Entity('contribution_group_tags', {
  engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
})
export class ContributionGroupTag extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Index()
  @Column({ name: 'contribution_id', type: 'int', unsigned: true, nullable: false })
  contributionId: number

  @Index()
  @Column({ name: 'group_tag_id', type: 'int', unsigned: true, nullable: false })
  groupTagId: number

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date
}
