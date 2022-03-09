import Decimal from 'decimal.js-light'
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { DecimalTransformer } from '../../src/typeorm/DecimalTransformer'

@Entity('transaction_links')
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ unsigned: true, nullable: false })
  userId: number

  @Column({
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: false,
    transformer: DecimalTransformer,
  })
  amount: Decimal

  @Column({ length: 255, nullable: false, collation: 'utf8mb4_unicode_ci' })
  memo: string

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  validUntil: Date

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
  })
  redeemedAt: Date

  @Column({
    type: 'boolean',
    default: () => false,
    nullable: false,
  })
  showEmail: boolean

  @Column({ unsigned: true, nullable: true })
  redeemedBy: number
}
