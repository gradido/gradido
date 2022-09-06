import {
  BaseEntity,
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Contribution } from '../Contribution'
import { User } from '../User'

@Entity('contribution_messages', {
  engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
})
export class ContributionMessage extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'contribution_id', unsigned: true, nullable: false })
  contributionId: number

  @ManyToOne(() => Contribution, (contribution) => contribution.messages)
  @JoinColumn({ name: 'contribution_id' })
  contribution: Contribution

  @Column({ name: 'user_id', unsigned: true, nullable: false })
  userId: number

  @ManyToOne(() => User, (user) => user.messages)
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ length: 2000, nullable: false, collation: 'utf8mb4_unicode_ci' })
  message: string

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date

  @Column({ type: 'datetime', default: null, nullable: true, name: 'updated_at' })
  updatedAt: Date

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null

  @Column({ name: 'deleted_by', default: null, unsigned: true, nullable: true })
  deletedBy: number

  @Column({ length: 12, nullable: false, collation: 'utf8mb4_unicode_ci' })
  type: string

  @Column({ name: 'is_moderator', type: 'bool', nullable: false, default: false })
  isModerator: boolean
}
