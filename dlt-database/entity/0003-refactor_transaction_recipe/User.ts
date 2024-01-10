import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn } from 'typeorm'

import { Account } from '../Account'

@Entity('users', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({
    name: 'gradido_id',
    length: 36,
    nullable: true,
    collation: 'utf8mb4_unicode_ci',
  })
  gradidoID?: string

  @Column({ name: 'derive1_pubkey', type: 'binary', length: 32, unique: true })
  derive1Pubkey: Buffer

  @Column({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date

  // use timestamp from iota milestone which is only in seconds precision, so no need to use 3 Bytes extra here
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
