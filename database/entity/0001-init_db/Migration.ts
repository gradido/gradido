import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('migrations')
export class Migration extends BaseEntity {
  @PrimaryGeneratedColumn() // This is actually not a primary column
  version: number

  @Column({ type: 'varchar', length: 256, nullable: true, default: null })
  fileName: string

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  date: Date
}
