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
 * Where a name came from. There are four values rather than two because the origin
 * answers two questions that do not move together:
 *
 * 1. **Has the member answered the question the window at first login asks?**
 *    `chosen` and `adopted` say yes, `assigned` and `migrated` say no.
 * 2. **Does it count against the four picks a year?** Only `chosen` - the name the
 *    member typed themselves. Keeping the name the system built is an answer, not a
 *    pick, so it costs nothing (NU-010/011).
 *
 * Conflating the two is what made a kept name cost a quarter of the yearly quota for
 * a name nobody chose.
 *
 * `migrated` is an `assigned` that migration 0116 handed out. It is kept apart so the
 * rollback of that migration takes back its own work and leaves alone the names that
 * were already there.
 */
export const ALIAS_ORIGIN_ASSIGNED = 'assigned'
export const ALIAS_ORIGIN_MIGRATED = 'migrated'
export const ALIAS_ORIGIN_CHOSEN = 'chosen'
export const ALIAS_ORIGIN_ADOPTED = 'adopted'
export type AliasOrigin =
  | typeof ALIAS_ORIGIN_ASSIGNED
  | typeof ALIAS_ORIGIN_MIGRATED
  | typeof ALIAS_ORIGIN_CHOSEN
  | typeof ALIAS_ORIGIN_ADOPTED

/** The member has answered - by typing a name or by keeping the one they were given. */
export const aliasOriginIsSettled = (origin: AliasOrigin): boolean =>
  origin === ALIAS_ORIGIN_CHOSEN || origin === ALIAS_ORIGIN_ADOPTED

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
