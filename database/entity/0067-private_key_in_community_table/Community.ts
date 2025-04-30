import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('communities')
export class Community extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'foreign', type: 'bool', nullable: false, default: true })
  foreign: boolean

  @Column({ name: 'url', length: 255, nullable: false })
  url: string

  @Column({ name: 'public_key', type: 'binary', length: 64, nullable: false })
  publicKey: Buffer

  @Column({ name: 'private_key', type: 'binary', length: 64, nullable: true })
  privateKey: Buffer | null

  @Column({
    name: 'community_uuid',
    type: 'char',
    length: 36,
    nullable: true,
    collation: 'utf8mb4_unicode_ci',
  })
  communityUuid: string | null

  @Column({ name: 'authenticated_at', type: 'datetime', nullable: true })
  authenticatedAt: Date | null

  @Column({ name: 'name', type: 'varchar', length: 40, nullable: true })
  name: string | null

  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
  description: string | null

  @CreateDateColumn({ name: 'creation_date', type: 'datetime', nullable: true })
  creationDate: Date | null

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP(3)',
    nullable: false,
  })
  createdAt: Date

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    onUpdate: 'CURRENT_TIMESTAMP(3)',
    nullable: true,
  })
  updatedAt: Date | null
}
