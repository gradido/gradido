import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('server_users')
export class ServerUser extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ length: 50 })
  username: string

  @Column({ type: 'bigint', unsigned: true })
  password: BigInt

  @Column({ length: 50, unique: true })
  email: string

  @Column({ length: 20, default: 'admin' })
  role: string

  @Column({ length: 20, default: 0 })
  activated: TinyInt

  @Column({ name: 'last_login', default: null, nullable: true })
  lastLogin: Date

  @Column({ name: 'created', default: () => 'CURRENT_TIMESTAMP' })
  created: Date

  @Column({ name: 'created', default: () => 'CURRENT_TIMESTAMP' })
  modified: Date
}
