import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('server_users')
export class ServerUser extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ length: 50 })
  username: string

  @Column({ length: 255 })
  password: string

  @Column({ length: 50, unique: true })
  email: string

  @Column({ length: 20, default: 'admin' })
  role: string

  @Column({ default: 0 })
  activated: number

  @Column({ name: 'last_login', default: null, nullable: true })
  lastLogin: Date

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  created: Date

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  modified: Date
}
