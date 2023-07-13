import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { User } from '../User'

@Entity('user_roles', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class UserRole extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'user_id', type: 'int', unsigned: true, nullable: false })
  userId: number

  @Column({ length: 40, nullable: false, collation: 'utf8mb4_unicode_ci' })
  role: string

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  createdAt: Date

  @Column({ name: 'updated_at', nullable: true, default: null, type: 'datetime' })
  updatedAt: Date | null

  @ManyToOne(() => User, (user) => user.userRoles)
  @JoinColumn({ name: 'user_id' })
  user: User
}
