import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from './User'

@Entity('alias_history', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class AliasHistory extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({
    name: 'user_id',
    type: 'int',
    unsigned: true,
    nullable: false,
  })
  userId: number

  @Column({
    name: 'alias',
    type: 'varchar',
    length: 20,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  alias: string

  @Column({
    name: 'community_uuid',
    type: 'char',
    length: 36,
    nullable: true,
    collation: 'utf8mb4_unicode_ci',
  })
  communityUuid: string

  @Column({
    name: 'first_usage_at',
    type: 'datetime',
    precision: 3,
    default: null,
    nullable: true,
  })
  firstUsageAt: Date | null

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
    nullable: false,
  })
  createdAt: Date

  @OneToOne(
    () => User,
    (user) => user.aliasHistory,
  )
  user: User

  @JoinColumn({ name: 'id', referencedColumnName: 'userId' })
  userEntity?: User | null
  
}
