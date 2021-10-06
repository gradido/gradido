import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { UserSetting } from './UserSetting'
import { UserSetting } from './UserSetting'
import { UserSetting } from './UserSetting'

// Moriz: I do not like the idea of having two user tables
@Entity('state_users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  //   @ManyToOne(type => Group, group => group.users)
  //    group: Group;

  @Column({ type: 'binary', length: 32, name: 'public_key' })
  pubkey: Buffer

  @Column()
  email: string

  @Column({ name: 'first_name' })
  firstName: string

  @Column({ name: 'last_name' })
  lastName: string

  @Column()
  username: string

  @Column()
  disabled: boolean

  @OneToMany(() => UserSetting, (userSetting) => userSetting.user)
  settings: UserSetting[]
}
