import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

// Group functions: a user's personal creation-group list.
// The entry with the lowest sortOrder is the user's main tag, pre-filled in the
// creation-group field on submission. User-maintained AND moderator-editable — healing a
// forgotten/misspelled tag happens on the user's list, not just on one contribution.
// No FK constraints (matches the crea_records convention) — indices only.
@Index('uniq_user_creation_group', ['userId', 'creationGroupId'], { unique: true })
@Entity('user_creation_groups', {
  engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
})
export class UserCreationGroup extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Index()
  @Column({ name: 'user_id', type: 'int', unsigned: true, nullable: false })
  userId: number

  @Index()
  @Column({ name: 'creation_group_id', type: 'int', unsigned: true, nullable: false })
  creationGroupId: number

  @Column({ name: 'sort_order', type: 'int', unsigned: true, nullable: false, default: 0 })
  sortOrder: number

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date
}
