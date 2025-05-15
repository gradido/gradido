import { Decimal } from 'decimal.js-light'
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { DecimalTransformer } from '../../src/typeorm/DecimalTransformer'

@Entity('admin_pending_creations')
export class AdminPendingCreation extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ type: 'bigint', unsigned: true, nullable: false })
  userId: number

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created: Date

  @Column({ type: 'datetime', nullable: false })
  date: Date

  @Column({ type: 'varchar', length: 255, nullable: false, collation: 'utf8mb4_unicode_ci' })
  memo: string

  @Column({
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: false,
    transformer: DecimalTransformer,
  })
  amount: Decimal

  @Column()
  moderator: number
}
