import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { UserSetting } from './UserSetting'

// Moriz: I do not like the idea of having two user tables
@Entity('state_users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ default: 0, name: 'index_id' })
  indexId: number

  @Column({ default: 0, name: 'group_id', unsigned: true })
  groupId: number

  @Column({ type: 'binary', length: 32, name: 'public_key' })
  pubkey: Buffer

  @Column({ length: 255, nullable: true, default: null })
  email: string

  @Column({ name: 'first_name', length: 255, nullable: true, default: null })
  firstName: string

  @Column({ name: 'last_name', length: 255, nullable: true, default: null })
  lastName: string

  @Column({ length: 255, nullable: true, default: null })
  username: string

  @Column()
  disabled: boolean

  @OneToMany(() => UserSetting, (userSetting) => userSetting.user)
  settings: UserSetting[]
}
