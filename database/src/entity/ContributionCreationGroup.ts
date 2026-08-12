import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'

// Group functions: join between a contribution and a
// creation group. A contribution can carry several tags. No FK constraints (matches the
// crea_records convention) — indices only.
@Index('uniq_contribution_creation_group', ['contributionId', 'creationGroupId'], { unique: true })
@Entity('contribution_creation_groups', {
  engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
})
export class ContributionCreationGroup extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Index()
  @Column({ name: 'contribution_id', type: 'int', unsigned: true, nullable: false })
  contributionId: number

  @Index()
  @Column({ name: 'creation_group_id', type: 'int', unsigned: true, nullable: false })
  creationGroupId: number

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date
}
