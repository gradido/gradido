import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { User } from './User'

/**
 * Where a name came from. Only a name the member picked counts against their yearly
 * quota - a name the system handed out is a proposal until they adopt it.
 */
export const ALIAS_ORIGIN_ASSIGNED = 'assigned'
export const ALIAS_ORIGIN_CHOSEN = 'chosen'
export type AliasOrigin = typeof ALIAS_ORIGIN_ASSIGNED | typeof ALIAS_ORIGIN_CHOSEN

/**
 * Every name a member owns - not a log of the ones they left behind. `users.alias`
 * marks which of them is current, so reclaiming an earlier name moves that marker and
 * writes nothing here.
 */
@Entity('user_aliases', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class UserAlias extends BaseEntity {
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
    nullable: false,
    collation: 'utf8mb4_unicode_ci',
  })
  alias: string

  @Column({
    name: 'community_uuid',
    type: 'varchar',
    length: 36,
    nullable: false,
    collation: 'utf8mb4_unicode_ci',
  })
  communityUuid: string

  @Column({
    name: 'origin',
    type: 'varchar',
    length: 8,
    nullable: false,
    default: ALIAS_ORIGIN_CHOSEN,
    collation: 'utf8mb4_unicode_ci',
  })
  origin: AliasOrigin

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
    nullable: false,
  })
  createdAt: Date

  @ManyToOne(
    () => User,
    (user) => user.aliases,
  )
  @JoinColumn({ name: 'user_id' })
  user?: User
}
