import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { User } from './User'

@Entity('user_roles', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
// 0 or 1 role per member (migration 0135), hence `User.userRole` and not a list.
@Index('user_id', ['userId'], { unique: true })
export class UserRole extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'user_id', type: 'int', unsigned: true, nullable: false })
  userId: number

  @Column({ type: 'varchar', length: 40, nullable: false, collation: 'utf8mb4_unicode_ci' })
  role: string

  // Group functions: a moderator's visibility scope, stored as a JSON array
  // of creation-group strings plus the reserved sentinels '*all' / '*untagged'. NULL = no
  // restriction (backward compatible: existing moderators keep full visibility).
  @Column({ name: 'visible_creation_groups', type: 'text', nullable: true, default: null })
  visibleCreationGroups: string | null

  // Support-Anfragen K6: the tick "may handle support requests" (see the schema). Read here for
  // the rights of every signed-in request (isAuthorized) and for the member search; written only by
  // a query of its own in queries/userRoles.ts, never through this entity.
  //
  // ⛔ `insert: false, update: false`: TypeORM's save() of a row it loaded earlier writes back each
  // column that differs from the row as it stands by then (saveModeratorScope, the renaming of a
  // group), so a tick set between that load and that save would be taken back. And where the row
  // was deleted in between (the role taken away), save() inserts the loaded row anew: a tick
  // written on that insert would come back with it, while taking the role away is what resets it.
  // So no row this entity writes carries a tick; one it inserts starts without.
  @Column({
    name: 'support_duty',
    type: 'bool',
    nullable: false,
    default: false,
    insert: false,
    update: false,
  })
  supportDuty: boolean

  // "Meine Gruppen" (MG1): the creation groups the holder handles themself, JSON text (see the
  // schema). Read here with the role of every signed-in request (isAuthorized), so the contribution
  // list and the question for the choice need no query of their own; written only by
  // dbUpdateUserRoleHandledGroups. `insert: false, update: false` for the reason given at
  // `supportDuty`: a save() of a row loaded earlier would take back a choice saved in between.
  @Column({
    name: 'handled_creation_groups',
    type: 'text',
    nullable: true,
    default: null,
    insert: false,
    update: false,
  })
  handledCreationGroups: string | null

  // "Meine Gruppen" of the support (MG2b): the groups whose support requests the holder handles
  // themself, beside handledCreationGroups and read the same way; written only by
  // dbUpdateUserRoleHandledGroups, so `insert: false, update: false` for the same reason.
  @Column({
    name: 'handled_support_groups',
    type: 'text',
    nullable: true,
    default: null,
    insert: false,
    update: false,
  })
  handledSupportGroups: string | null

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

  @OneToOne(
    () => User,
    (user) => user.userRole,
  )
  @JoinColumn({ name: 'user_id' })
  user: User
}
