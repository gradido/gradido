import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

// Moriz: I do not like the idea of having two user tables
@Entity('login_users')
export class LoginUser extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ length: 191, unique: true })
  email: string

  @Column({ name: 'first_name', length: 150 })
  firstName: string

  @Column({ name: 'last_name', length: 255, default: '' })
  lastName: string

  @Column({ length: 255, default: '' })
  username: string

  @Column({ default: '' })
  description: string

  @Column({ type: 'bigint', default: 0, unsigned: true })
  password: string

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

  @Column({ length: 4, default: 'de' })
  language: string

  @Column({ default: 0 })
  disabled: boolean

  @Column({ name: 'group_id', default: 0, unsigned: true })
  groupId: number

  @Column({ name: 'publisher_id', default: 0 })
  publisherId: number
}
