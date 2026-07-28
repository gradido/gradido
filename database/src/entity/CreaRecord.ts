import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

// One row per evaluated activity (decisions E-004 / E-006 / E-007 / E-010 / E-011).
// Becomes the participant history (read back into the next evaluation) and the
// study data. Pseudonymous by design: community readable, person a pseudonym, no name.
@Entity('crea_records', {
  engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
})
export class CreaRecord extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Index({ unique: true })
  @Column({ name: 'record_uuid', type: 'char', length: 36, nullable: false })
  recordUuid: string

  @Index()
  @Column({
    name: 'contribution_ref',
    type: 'varchar',
    length: 64,
    nullable: false,
    collation: 'utf8mb4_unicode_ci',
  })
  contributionRef: string

  @Index()
  @Column({ name: 'community_uuid', type: 'char', length: 36, nullable: true, default: null })
  communityUuid: string | null

  @Index()
  @Column({
    name: 'person_pseudonym',
    type: 'varchar',
    length: 64,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  personPseudonym: string | null

  @Column({ type: 'varchar', length: 255, nullable: false, collation: 'utf8mb4_unicode_ci' })
  activity: string

  @Index()
  @Column({
    name: 'category_key',
    type: 'varchar',
    length: 48,
    nullable: false,
    collation: 'utf8mb4_unicode_ci',
  })
  categoryKey: string

  @Column({
    name: 'output_type',
    type: 'varchar',
    length: 24,
    nullable: false,
    collation: 'utf8mb4_unicode_ci',
  })
  outputType: string

  @Column({ type: 'double', nullable: true, default: null })
  hours: number | null

  @Column({ name: 'hours_estimated', type: 'bool', nullable: false, default: false })
  hoursEstimated: boolean

  @Column({
    name: 'crea_verdict',
    type: 'varchar',
    length: 12,
    nullable: false,
    collation: 'utf8mb4_unicode_ci',
  })
  creaVerdict: string

  @Column({ type: 'varchar', length: 8, nullable: false, collation: 'utf8mb4_unicode_ci' })
  confidence: string

  @Column({
    name: 'applied_rule',
    type: 'varchar',
    length: 48,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  appliedRule: string | null

  @Column({
    type: 'varchar',
    length: 24,
    nullable: false,
    default: 'none',
    collation: 'utf8mb4_unicode_ci',
  })
  discrepancy: string

  @Column({
    name: 'overall_verdict',
    type: 'varchar',
    length: 12,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  overallVerdict: string | null

  @Column({
    name: 'moderator_final',
    type: 'varchar',
    length: 24,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  moderatorFinal: string | null

  @Column({ name: 'moderator_comment', type: 'text', nullable: true, default: null })
  moderatorComment: string | null

  @Column({ name: 'raw_text', type: 'text', nullable: true, default: null })
  rawText: string | null

  @Column({ name: 'taxonomy_version', type: 'int', unsigned: true, nullable: false, default: 1 })
  taxonomyVersion: number

  @Column({ name: 'ruleset_version', type: 'int', unsigned: true, nullable: false, default: 1 })
  rulesetVersion: number

  @Column({ name: 'behavior_version', type: 'int', unsigned: true, nullable: false, default: 1 })
  behaviorVersion: number

  @Column({
    type: 'varchar',
    length: 48,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  model: string | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date
}
