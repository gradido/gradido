import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm'
import { LoginUserBackup } from '../LoginUserBackup'

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

  @Column({ default: '', collation: 'utf8mb4_unicode_ci' })
  description: string

  @Column({ type: 'bigint', default: 0, unsigned: true })
  password: BigInt

  @Column({ name: 'pubkey', type: 'binary', length: 32, default: null, nullable: true })
  pubKey: Buffer

  @Column({ name: 'privkey', type: 'binary', length: 80, default: null, nullable: true })
  privKey: Buffer

  @Column({ name: 'email_hash', type: 'binary', length: 32, default: null, nullable: true })
  emailHash: Buffer

  @Column({ name: 'created', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @Column({ name: 'email_checked', default: 0 })
  emailChecked: boolean

  @Column({ name: 'passphrase_shown', default: 0 })
  passphraseShown: boolean

  @Column({ length: 4, default: 'de', collation: 'utf8mb4_unicode_ci' })
  language: string

  @Column({ default: 0 })
  disabled: boolean

  @Column({ name: 'group_id', default: 0, unsigned: true })
  groupId: number

  @Column({ name: 'publisher_id', default: 0 })
  publisherId: number

  @OneToOne(() => LoginUserBackup, (loginUserBackup) => loginUserBackup.loginUser)
  loginUserBackup: LoginUserBackup
}
