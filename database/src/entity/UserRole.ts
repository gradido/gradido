import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from './User'

@Entity('user_roles', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class UserRole extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'user_id', type: 'int', unsigned: true, nullable: false })
  userId: number

  @Column({ type: 'varchar', length: 40, nullable: false, collation: 'utf8mb4_unicode_ci' })
  role: string

  // Group functions: a moderator's visibility scope, stored as a JSON array
  // of group-tag strings plus the reserved sentinels '*all' / '*untagged'. NULL = no
  // restriction (backward compatible: existing moderators keep full visibility).
  @Column({ name: 'visible_group_tags', type: 'text', nullable: true, default: null })
  visibleGroupTags: string | null

  @Column({
    name: 'created_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
    nullable: false,
  })
  createdAt: Date

  @Column({ name: 'updated_at', type: 'datetime', precision: 3, nullable: true, default: null })
  updatedAt: Date | null

  @ManyToOne(
    () => User,
    (user) => user.userRoles,
  )
  @JoinColumn({ name: 'user_id' })
  user: User
}
