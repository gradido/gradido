import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'
import { User } from './User'

@Entity()
export class UserSetting extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  userId: number

  @ManyToOne(() => User, (user) => user.settings)
  user: User

  @Column()
  key: string

  @Column()
  value: string
}
