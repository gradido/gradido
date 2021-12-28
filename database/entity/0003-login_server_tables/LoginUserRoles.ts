import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('login_user_roles')
export class LoginUserRoles extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'user_id' })
  userId: number

  @Column({ name: 'role_id' })
  roleId: number
}
