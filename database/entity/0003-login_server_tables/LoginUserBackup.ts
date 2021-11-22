import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('login_user_backups')
export class LoginUserBackup extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'user_id', nullable: false })
  userId: number

  @Column({ type: 'text', name: 'passphrase', nullable: false })
  passphrase: string

  @Column({ name: 'mnemonic_type', default: -1 })
  mnemonicType: number
}
