import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

// import { Group } from "./Group"

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

  // Moriz: I am voting for the data mapper implementation.
  // see: https://typeorm.io/#/active-record-data-mapper/what-is-the-data-mapper-pattern
  // We should discuss this ASAP
  static findByPubkeyHex(pubkeyHex: string): Promise<User> {
    return this.createQueryBuilder('user')
      .where('hex(user.pubkey) = :pubkeyHex', { pubkeyHex })
      .getOneOrFail()
  }
}
