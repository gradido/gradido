import { BaseEntity, Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { LoginUserBackup } from '../0003-login_server_tables/LoginUserBackup'

// Moriz: I do not like the idea of having two user tables
@Entity('login_users', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class LoginUser extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ length: 191, unique: true, collation: 'utf8mb4_unicode_ci' })
  email: string

  @Column({ name: 'first_name', length: 150, collation: 'utf8mb4_unicode_ci' })
  firstName: string

  @Column({ name: 'last_name', length: 255, default: '', collation: 'utf8mb4_unicode_ci' })
  lastName: string

  @Column({ length: 255, default: '', collation: 'utf8mb4_unicode_ci' })
  username: string

  @Column({ type: 'mediumtext', default: '', collation: 'utf8mb4_unicode_ci', nullable: true })
  description: string

  @Column({ type: 'bigint', default: 0, unsigned: true })
  password: BigInt

  @Column({ name: 'pubkey', type: 'binary', length: 32, default: null, nullable: true })
  pubKey: Buffer

  @Column({ name: 'privkey', type: 'binary', length: 80, default: null, nullable: true })
  privKey: Buffer

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

  @Column({ type: 'bool', default: false })
  disabled: boolean

  @Column({ name: 'group_id', default: 0, unsigned: true })
  groupId: number

  @Column({ name: 'publisher_id', default: 0 })
  publisherId: number

  @OneToOne(
    () => LoginUserBackup,
    (loginUserBackup) => loginUserBackup.loginUser,
  )
  loginUserBackup: LoginUserBackup
}
