import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
  OneToMany,
  JoinColumn,
  OneToOne,
} from 'typeorm'
import { Contribution } from '../Contribution'
import { ContributionMessage } from '../ContributionMessage'
import { UserContact } from '../UserContact'

@Entity('users', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({
    name: 'gradido_id',
    length: 36,
    nullable: false,
    collation: 'utf8mb4_unicode_ci',
  })
  gradidoID: string

  @Column({
    name: 'alias',
    length: 20,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  alias: string

  @Column({ name: 'public_key', type: 'binary', length: 32, default: null, nullable: true })
  pubKey: Buffer

  @Column({ name: 'privkey', type: 'binary', length: 80, default: null, nullable: true })
  privKey: Buffer

  /*
  @Column({ length: 255, unique: true, nullable: false, collation: 'utf8mb4_unicode_ci' })
  email: string
  */
  @OneToOne(() => UserContact, (emailContact: UserContact) => emailContact.user)
  @JoinColumn({ name: 'email_id' })
  emailContact: UserContact

  @Column({ name: 'email_id', type: 'int', unsigned: true, nullable: true, default: null })
  emailId: number | null

  @Column({
    name: 'first_name',
    length: 255,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  firstName: string

  @Column({
    name: 'last_name',
    length: 255,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  lastName: string

  @DeleteDateColumn()
  deletedAt: Date | null

  @Column({ type: 'bigint', default: 0, unsigned: true })
  password: BigInt

  @Column({ name: 'created', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  createdAt: Date
  /*
  @Column({ name: 'email_checked', type: 'bool', nullable: false, default: false })
  emailChecked: boolean
  */

  @Column({ length: 4, default: 'de', collation: 'utf8mb4_unicode_ci', nullable: false })
  language: string

  @Column({ name: 'is_admin', type: 'datetime', nullable: true, default: null })
  isAdmin: Date | null

  @Column({ name: 'referrer_id', type: 'int', unsigned: true, nullable: true, default: null })
  referrerId?: number | null

  @Column({
    name: 'contribution_link_id',
    type: 'int',
    unsigned: true,
    nullable: true,
    default: null,
  })
  contributionLinkId?: number | null

  @Column({ name: 'publisher_id', default: 0 })
  publisherId: number

  @Column({
    type: 'text',
    name: 'passphrase',
    collation: 'utf8mb4_unicode_ci',
    nullable: true,
    default: null,
  })
  passphrase: string

  @OneToMany(() => Contribution, (contribution) => contribution.user)
  @JoinColumn({ name: 'user_id' })
  contributions?: Contribution[]

  @OneToMany(() => ContributionMessage, (message) => message.user)
  @JoinColumn({ name: 'user_id' })
  messages?: ContributionMessage[]

  @OneToMany(() => UserContact, (userContact: UserContact) => userContact.user)
  @JoinColumn({ name: 'user_id' })
  userContacts?: UserContact[]
}
