import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('communities')
export class Community extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'public_key', type: 'binary', length: 64, default: null, nullable: true })
  publicKey: Buffer

  @Column({ name: 'api_version', length: 10, nullable: false })
  apiVersion: string

  @Column({ name: 'end_point', length: 255, nullable: false })
  endPoint: string

  @Column({ name: 'last_announced_at', type: 'datetime', nullable: false })
  lastAnnouncedAt: Date

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  createdAt: Date

  @Column({ name: 'updated_at', type: 'datetime', nullable: true, default: null })
  updatedAt: Date | null
}
