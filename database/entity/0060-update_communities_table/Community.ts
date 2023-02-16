import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('communities')
export class Community extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'foreign', type: 'bool', nullable: false, default: true })
  foreign: boolean

  @Column({ name: 'public_key', type: 'binary', length: 64, default: null, nullable: true })
  publicKey: Buffer

  @Column({ name: 'api_version', length: 10, nullable: false })
  apiVersion: string

  @Column({ name: 'end_point', length: 255, nullable: false })
  endPoint: string

  @Column({ name: 'last_announced_at', type: 'datetime', nullable: true })
  lastAnnouncedAt: Date

  @Column({ name: 'verified_at', type: 'datetime', nullable: true })
  verifiedAt: Date

  @Column({ name: 'last_error_at', type: 'datetime', nullable: true })
  lastErrorAt: Date

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
