import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('community')
export class Community extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ length: 36, unique: true })
  uuid: string

  @Column({ length: 255 })
  name: string

  @Column({ length: 255 })
  description: string

  @Column({ default: () => 'CURRENT_TIMESTAMP', nullable: false })
  createdAt: Date
}
