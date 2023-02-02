import Decimal from 'decimal.js-light'
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { DecimalTransformer } from '../../src/typeorm/DecimalTransformer'

@Entity('event_protocol')
export class EventProtocol extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ length: 100, nullable: false, collation: 'utf8mb4_unicode_ci' })
  type: string

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @Column({ name: 'user_id', unsigned: true, nullable: false })
  userId: number

  @Column({ name: 'x_user_id', unsigned: true, nullable: true })
  xUserId: number | null

  @Column({ name: 'x_community_id', unsigned: true, nullable: true })
  xCommunityId: number | null

  @Column({ name: 'transaction_id', unsigned: true, nullable: true })
  transactionId: number | null

  @Column({ name: 'contribution_id', unsigned: true, nullable: true })
  contributionId: number | null

  @Column({
    type: 'decimal',
    precision: 40,
    scale: 20,
    nullable: true,
    transformer: DecimalTransformer,
  })
  amount: Decimal | null

  @Column({ name: 'message_id', unsigned: true, nullable: true })
  messageId: number | null
}
