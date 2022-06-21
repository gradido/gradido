import { BaseEntity, Entity, Column, PrimaryColumn } from 'typeorm'

@Entity('enum_event_type')
export class EnumEventType extends BaseEntity {
  @PrimaryColumn({ name: 'key', length: 100, nullable: false, collation: 'utf8mb4_unicode_ci' })
  key: string

  @Column({ name: 'value', unsigned: true, nullable: false })
  value: number

  @Column({ length: 200, nullable: false, collation: 'utf8mb4_unicode_ci' })
  description: string
}
