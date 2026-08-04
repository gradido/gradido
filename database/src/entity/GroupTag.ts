import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

// Group functions: the canonical list of valid group
// tags (admin-managed). `tag` is stored WITHOUT the leading '#'. Submission autocomplete
// and the moderator visibility scope both draw from this list.
@Entity('group_tags', {
  engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
})
export class GroupTag extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, nullable: false, collation: 'utf8mb4_unicode_ci' })
  tag: string

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  name: string | null

  // LEGACY-HASHTAG-ADOPTION -- removable with the feature.
  // When the hashtags that predate the group field were last looked at for this group, and
  // how many contributions that run adopted. NULL means never looked at -- true for every
  // group that existed before the adoption was built, which is what the admin list flags.
  @Column({
    name: 'hashtags_adopted_at',
    type: 'datetime',
    precision: 3,
    nullable: true,
    default: null,
  })
  hashtagsAdoptedAt: Date | null

  @Column({ name: 'hashtags_adopted_count', type: 'int', unsigned: true, nullable: true })
  hashtagsAdoptedCount: number | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date
}
