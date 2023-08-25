import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn } from 'typeorm'

import { Account } from './Account'

@Entity('users', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({
    name: 'gradido_id',
    length: 36,
    nullable: true,
    unique: true,
    collation: 'utf8mb4_unicode_ci',
  })
  gradidoID?: string

  @Column({ name: 'derive1_pubkey', type: 'binary', length: 32, unique: true })
  derive1Pubkey: Buffer

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  createdAt: Date

  @Column({
    name: 'confirmed_at',
    type: 'datetime',
    nullable: true,
  })
  confirmedAt?: Date

  @OneToMany(() => Account, (account) => account.user)
  @JoinColumn({ name: 'user_id' })
  accounts?: Account[]
}
