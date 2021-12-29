import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm'
import { Balance } from '../Balance'

// Moriz: I do not like the idea of having two user tables
@Entity('state_users', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'index_id', default: 0 })
  indexId: number

  @Column({ name: 'group_id', default: 0, unsigned: true })
  groupId: number

  @Column({ type: 'binary', length: 32, name: 'public_key' })
  pubkey: Buffer

  @Column({ length: 255, nullable: true, default: null, collation: 'utf8mb4_unicode_ci' })
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

  @Column({ length: 255, nullable: true, default: null, collation: 'utf8mb4_unicode_ci' })
  username: string

  @Column()
  disabled: boolean

  @OneToOne(() => Balance, (balance) => balance.user)
  balance: Balance
}
