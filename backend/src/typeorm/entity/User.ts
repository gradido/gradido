import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

// import { Group } from "./Group"
@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  //   @ManyToOne(type => Group, group => group.users)
  //    group: Group;

  @Column({ type: 'binary', length: 32 })
  pubkey: Buffer

  @Column()
  email: string

  @Column()
  firstName: string

  @Column()
  lastName: string

  @Column()
  username: string

  @Column()
  disabled: boolean

  static findByPubkeyHex(pubkeyHex: string): Promise<User> {
    return this.createQueryBuilder('user')
      .where('hex(user.pubkey) = :pubkeyHex', { pubkeyHex })
      .getOneOrFail()
  }
}
