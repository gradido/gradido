import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { UserSetting } from './UserSetting'

// import { Group } from "./Group"
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

  static findByPubkeyHex(pubkeyHex: string): Promise<User> {
    return this.createQueryBuilder('user')
      .where('hex(user.pubkey) = :pubkeyHex', { pubkeyHex })
      .getOneOrFail()
  }

  static async getUsersIndiced(userIds: number[]): Promise<User[]> {
    const users = await this.createQueryBuilder('user')
      .select(['user.id', 'user.firstName', 'user.lastName', 'user.email'])
      .where('user.id IN (:...users)', { users: userIds })
      .getMany()
    const usersIndiced: User[] = []
    users.forEach((value) => {
      usersIndiced[value.id] = value
    })
    return usersIndiced
  }
}
