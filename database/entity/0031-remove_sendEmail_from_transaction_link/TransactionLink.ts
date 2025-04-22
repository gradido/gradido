import { Decimal } from 'decimal.js-light'
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn } from 'typeorm'
import { DecimalTransformer } from '../../src/typeorm/DecimalTransformer'

@Entity('transaction_links')
export class TransactionLink extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ type: 'bigint', unsigned: true, nullable: false })
  userId: number

  @Column({
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: false,
    transformer: DecimalTransformer,
  })
  amount: Decimal

  @Column({
    type: 'decimal',
    name: 'hold_available_amount',
    precision: 40,
    scale: 20,
    nullable: false,
    transformer: DecimalTransformer,
  })
  holdAvailableAmount: Decimal

  @Column({ type: 'varchar', length: 255, nullable: false, collation: 'utf8mb4_unicode_ci' })
  memo: string

  @Column({ type: 'varchar', length: 24, nullable: false, collation: 'utf8mb4_unicode_ci' })
  code: string

  @Column({
    type: 'datetime',
    nullable: false,
  })
  createdAt: Date

  @DeleteDateColumn()
  deletedAt: Date | null

  @Column({
    type: 'datetime',
    nullable: false,
  })
  validUntil: Date

  @Column({
    type: 'datetime',
    nullable: true,
  })
  redeemedAt: Date | null

  @Column({ type: 'int', unsigned: true, nullable: true })
  redeemedBy: number | null
}
