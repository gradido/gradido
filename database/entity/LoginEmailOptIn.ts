import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

// Moriz: I do not like the idea of having two user tables
@Entity('login_email_opt_in')
export class LoginEmailOptIn extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'user_id', type: 'bigint', unsigned: true, nullable: false })
  userId: number

  @Column({ name: 'verification_code', type: 'bigint', unsigned: true, unique: true })
  verificationCode: BigInt

  @Column({ name: 'email_opt_in_type_id', type: 'int', unsigned: true, nullable: false })
  emailOptInTypeId: number

  @Column({ name: 'created', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @Column({ name: 'resend_count', type: 'int', unsigned: true, default: 0 })
  resendCount: number

  @Column({ name: 'updated', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date
}
