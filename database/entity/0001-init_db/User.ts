import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

// Moriz: I do not like the idea of having two user tables
@Entity('state_users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'index_id', default: 0 })
  indexId: number

  @Column({ name: 'group_id', default: 0, unsigned: true })
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
}
