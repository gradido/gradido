import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { UserSetting } from '../0002-add_settings/UserSetting'

@Entity('users', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

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

  @Column({ type: 'bool', default: false })
  disabled: boolean

  @Column({ type: 'bigint', default: 0, unsigned: true })
  password: BigInt

  @Column({ name: 'email_hash', type: 'binary', length: 32, default: null, nullable: true })
  emailHash: Buffer

  @Column({ name: 'created', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  createdAt: Date

  @Column({ name: 'email_checked', type: 'bool', nullable: false, default: false })
  emailChecked: boolean

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
