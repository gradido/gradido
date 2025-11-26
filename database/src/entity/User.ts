import {
  BaseEntity,
  Column,
  DeleteDateColumn,
  Entity,
  Geometry,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Community } from './Community'
import { Contribution } from './Contribution'
import { ContributionMessage } from './ContributionMessage'
import { DltTransaction } from './DltTransaction'
import { TransactionLink } from './TransactionLink'
import { GeometryTransformer } from './transformer/GeometryTransformer'
import { UserContact } from './UserContact'
import { UserRole } from './UserRole'

@Entity('users', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ type: 'bool', default: false })
  foreign: boolean

  @Column({
    name: 'gradido_id',
    type: 'char',
    length: 36,
    nullable: false,
    collation: 'utf8mb4_unicode_ci',
  })
  gradidoID: string

  @Column({
    name: 'community_uuid',
    type: 'char',
    length: 36,
    nullable: true,
    collation: 'utf8mb4_unicode_ci',
  })
  communityUuid: string

  @ManyToOne(
    () => Community,
    (community) => community.users,
  )
  @JoinColumn({ name: 'community_uuid', referencedColumnName: 'communityUuid' })
  community: Community | null

  @Column({
    name: 'alias',
    type: 'varchar',
    length: 20,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  alias: string

  @OneToOne(
    () => UserContact,
    (emailContact: UserContact) => emailContact.user,
  )
  @JoinColumn({ name: 'email_id' })
  emailContact: UserContact

  @Column({ name: 'email_id', type: 'int', unsigned: true, nullable: true, default: null })
  emailId: number | null

  @Column({
    name: 'first_name',
    type: 'varchar',
    length: 255,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  firstName: string

  @Column({
    name: 'last_name',
    type: 'varchar',
    length: 255,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  lastName: string

  @Column({ name: 'gms_publish_name', type: 'int', unsigned: true, nullable: false, default: 0 })
  gmsPublishName: number

  @Column({ name: 'humhub_publish_name', type: 'int', unsigned: true, nullable: false, default: 0 })
  humhubPublishName: number

  @Column({
    name: 'created_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
    nullable: false,
  })
  createdAt: Date

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', precision: 3, nullable: true })
  deletedAt: Date | null

  @Column({ type: 'bigint', default: 0, unsigned: true })
  password: BigInt

  @Column({
    name: 'password_encryption_type',
    type: 'int',
    unsigned: true,
    nullable: false,
    default: 0,
  })
  passwordEncryptionType: number

  @Column({
    type: 'varchar',
    length: 4,
    default: 'de',
    collation: 'utf8mb4_unicode_ci',
    nullable: false,
  })
  language: string

  @Column({ type: 'bool', default: false })
  hideAmountGDD: boolean

  @Column({ type: 'bool', default: false })
  hideAmountGDT: boolean

  @OneToMany(
    () => UserRole,
    (userRole) => userRole.user,
  )
  @JoinColumn({ name: 'user_id' })
  userRoles: UserRole[]

  @Column({ name: 'referrer_id', type: 'bigint', unsigned: true, nullable: true, default: null })
  referrerId?: number | null

  @Column({
    name: 'contribution_link_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
    default: null,
  })
  contributionLinkId?: number | null

  @Column({ name: 'publisher_id', type: 'bigint', unsigned: true, default: 0 })
  publisherId: number

  @Column({ name: 'gms_allowed', type: 'bool', default: true })
  gmsAllowed: boolean

  @Column({
    name: 'location',
    type: 'geometry',
    default: null,
    nullable: true,
    transformer: GeometryTransformer,
  })
  location: Geometry | null

  @Column({
    name: 'gms_publish_location',
    type: 'int',
    unsigned: true,
    nullable: false,
    default: 2,
  })
  gmsPublishLocation: number

  @Column({ name: 'gms_registered', type: 'bool', default: false })
  gmsRegistered: boolean

  @Column({
    name: 'gms_registered_at',
    type: 'datetime',
    precision: 3,
    default: null,
    nullable: true,
  })
  gmsRegisteredAt: Date | null

  @Column({ name: 'humhub_allowed', type: 'bool', default: false })
  humhubAllowed: boolean

  @OneToMany(
    () => Contribution,
    (contribution) => contribution.user,
  )
  @JoinColumn({ name: 'user_id' })
  contributions?: Contribution[]

  @OneToMany(
    () => ContributionMessage,
    (message) => message.user,
  )
  @JoinColumn({ name: 'user_id' })
  messages?: ContributionMessage[]

  @OneToMany(
    () => UserContact,
    (userContact: UserContact) => userContact.user,
  )
  @JoinColumn({ name: 'user_id' })
  userContacts?: UserContact[]

  @OneToOne(
    () => DltTransaction,
    (dlt) => dlt.userId,
  )
  @JoinColumn({ name: 'id', referencedColumnName: 'userId' })
  dltTransaction?: DltTransaction | null

  @OneToOne(
    () => TransactionLink,
    (transactionLink) => transactionLink.userId,
  )
  @JoinColumn({ name: 'id', referencedColumnName: 'userId' })
  transactionLink?: TransactionLink | null
}
