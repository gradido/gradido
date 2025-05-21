import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { User } from './User'

@Entity('user_contacts', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class UserContact extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({
    name: 'type',
    type: 'varchar',
    length: 100,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  type: string

  @OneToOne(
    () => User,
    (user) => user.emailContact,
  )
  user: User

  @Column({ name: 'user_id', type: 'int', unsigned: true, nullable: false })
  userId: number

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: false,
    collation: 'utf8mb4_unicode_ci',
  })
  email: string

  @Column({ name: 'gms_publish_email', type: 'bool', nullable: false, default: false })
  gmsPublishEmail: boolean

  @Column({ name: 'email_verification_code', type: 'bigint', unsigned: true, unique: true })
  emailVerificationCode: string

  @Column({
    name: 'email_opt_in_type_id',
    type: 'int',
    unsigned: true,
    nullable: false,
    default: 0,
  })
  emailOptInTypeId: number

  @Column({
    name: 'email_resend_count',
    type: 'int',
    unsigned: true,
    nullable: false,
    default: 0,
  })
  emailResendCount: number

  @Column({ name: 'email_checked', type: 'bool', nullable: false, default: false })
  emailChecked: boolean

  @Column({
    name: 'country_code',
    type: 'varchar',
    length: 255,
    unique: false,
    nullable: true,
    collation: 'utf8mb4_unicode_ci',
  })
  countryCode: string

  @Column({
    type: 'varchar',
    length: 255,
    unique: false,
    nullable: true,
    collation: 'utf8mb4_unicode_ci',
  })
  phone: string

  @Column({ name: 'gms_publish_phone', type: 'int', unsigned: true, nullable: false, default: 0 })
  gmsPublishPhone: number

  @CreateDateColumn({
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP(3)',
    nullable: false,
  })
  createdAt: Date

  @UpdateDateColumn({
    name: 'updated_at',
    nullable: true,
    onUpdate: 'CURRENT_TIMESTAMP(3)',
  })
  updatedAt: Date | null

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null
}
