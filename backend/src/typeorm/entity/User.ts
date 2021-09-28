import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

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
}
