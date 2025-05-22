import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm'

@Entity('openai_threads')
export class OpenaiThreads extends BaseEntity {
  @PrimaryColumn({ type: 'char', length: 30 })
  id: string

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @Column({ name: 'user_id', type: 'int', unsigned: true })
  userId: number
}
