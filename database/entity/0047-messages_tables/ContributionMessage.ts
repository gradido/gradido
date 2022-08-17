import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Contribution } from '../Contribution'

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

  @Column({ length: 2000, nullable: false, collation: 'utf8mb4_unicode_ci' })
  message: string

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date

  @Column({ type: 'datetime', default: null, nullable: true, name: 'updated_at' })
  updateAt: Date

  @Column({ type: 'datetime', default: null, nullable: true, name: 'deleted_at' })
  deletedAt: Date

  @Column({ name: 'deleted_by', default: null, unsigned: true, nullable: true })
  deletedBy: number

  @Column({ length: 12, nullable: false, collation: 'utf8mb4_unicode_ci' })
  type: string
}
