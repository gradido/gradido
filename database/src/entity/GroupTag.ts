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

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date
}
