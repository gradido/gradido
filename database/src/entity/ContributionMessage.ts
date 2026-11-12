import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { type Contribution as ContributionType } from './Contribution'
import { type User as UserType } from './User'

@Entity('contribution_messages', {
  engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
})
export class ContributionMessage extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Index()
  @Column({ name: 'contribution_id', type: 'int', unsigned: true, nullable: false })
  contributionId: number

  @ManyToOne(
    () => require('./Contribution').Contribution,
    (contribution: ContributionType) => contribution.messages,
  )
  @JoinColumn({ name: 'contribution_id' })
  contribution: ContributionType

  @Column({ name: 'user_id', type: 'int', unsigned: true, nullable: false })
  userId: number

  @ManyToOne(
    () => require('./User').User,
    (user: UserType) => user.messages,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserType

  @Column({ type: 'varchar', length: 2000, nullable: false, collation: 'utf8mb4_unicode_ci' })
  message: string

  @CreateDateColumn()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn()
  @Column({ type: 'datetime', default: null, nullable: true, name: 'updated_at' })
  updatedAt: Date | null

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null

  @Column({ name: 'deleted_by', type: 'int', default: null, unsigned: true, nullable: true })
  deletedBy: number | null

  @Column({
    type: 'varchar',
    length: 12,
    nullable: false,
    default: 'DIALOG',
    collation: 'utf8mb4_unicode_ci',
  })
  type: string

  @Column({ name: 'is_moderator', type: 'bool', nullable: false, default: false })
  isModerator: boolean

  // The language model whose words this message carries, by name; NULL where a person wrote it.
  @Column({ name: 'ai_model', type: 'varchar', length: 64, nullable: true, default: null })
  aiModel: string | null
}
