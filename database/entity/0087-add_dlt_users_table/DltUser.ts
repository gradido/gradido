import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm'
import { User } from '../User'

@Entity('dlt_users', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class DltUser extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'user_id', type: 'int', unsigned: true, nullable: false })
  userId: number

  @Column({
    name: 'message_id',
    length: 64,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  messageId: string

  @Column({ name: 'verified', type: 'bool', nullable: false, default: false })
  verified: boolean

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP(3)', nullable: false })
  createdAt: Date

  @Column({ name: 'verified_at', nullable: true, default: null, type: 'datetime' })
  verifiedAt: Date | null

  @OneToOne(() => User, (user) => user.dltUser)
  @JoinColumn({ name: 'user_id' })
  user?: User | null
}
