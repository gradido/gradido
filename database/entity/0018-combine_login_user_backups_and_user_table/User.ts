import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { UserSetting } from '../0002-add_settings/UserSetting'

@Entity('state_users', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'login_user_id', default: null, unsigned: true })
  loginUserId: number

  @Column({ name: 'index_id', type: 'smallint', default: 0, nullable: false })
  indexId: number

  @Column({ name: 'public_key', type: 'binary', length: 32, default: null, nullable: true })
  pubKey: Buffer

  @Column({ name: 'privkey', type: 'binary', length: 80, default: null, nullable: true })
  privKey: Buffer

  @Column({ length: 255, unique: true, nullable: false, collation: 'utf8mb4_unicode_ci' })
  email: string

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

  @Column({ length: 255, nullable: true, default: null, collation: 'utf8mb4_unicode_ci' })
  username: string

  @Column({ type: 'bool', default: false })
  disabled: boolean

  @Column({ type: 'mediumtext', default: '', collation: 'utf8mb4_unicode_ci', nullable: true })
  description: string

  @Column({ type: 'bigint', default: 0, unsigned: true })
  password: BigInt

  @Column({ name: 'email_hash', type: 'binary', length: 32, default: null, nullable: true })
  emailHash: Buffer

  @Column({ name: 'created', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  createdAt: Date

  @Column({ name: 'email_checked', type: 'bool', nullable: false, default: false })
  emailChecked: boolean

  @Column({ name: 'passphrase_shown', type: 'bool', nullable: false, default: false })
  passphraseShown: boolean

  @Column({ length: 4, default: 'de', collation: 'utf8mb4_unicode_ci', nullable: false })
  language: string

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

  @OneToMany(() => UserSetting, (userSetting) => userSetting.user)
  settings: UserSetting[]
}
