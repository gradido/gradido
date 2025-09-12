import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm'

@Entity('semaphores')
export class Semaphore extends BaseEntity {
  @PrimaryColumn({ type: 'char', length: 255 })
  key: string

  @Column({ type: 'int', unsigned: true })
  count: number

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @Column({ name: 'owner', type: 'varchar', length: 255, nullable: false })
  owner: string
}
