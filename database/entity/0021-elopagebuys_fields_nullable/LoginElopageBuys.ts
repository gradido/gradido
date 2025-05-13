import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('login_elopage_buys')
export class LoginElopageBuys extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ type: 'int', width: 11, name: 'elopage_user_id', nullable: true, default: null })
  elopageUserId: number | null

  @Column({ type: 'int', width: 11, name: 'affiliate_program_id', nullable: true, default: null })
  affiliateProgramId: number | null

  @Column({ type: 'int', width: 11, name: 'publisher_id', nullable: true, default: null })
  publisherId: number | null

  @Column({ type: 'int', width: 11, name: 'order_id', nullable: true, default: null })
  orderId: number | null

  @Column({ type: 'int', width: 11, name: 'product_id', nullable: true, default: null })
  productId: number | null

  @Column({ name: 'product_price', nullable: false })
  productPrice: number

  @Column({
    name: 'payer_email',
    length: 255,
    nullable: false,
    charset: 'utf8',
    collation: 'utf8_bin',
  })
  payerEmail: string

  @Column({
    name: 'publisher_email',
    length: 255,
    nullable: false,
    charset: 'utf8',
    collation: 'utf8_bin',
  })
  publisherEmail: string

  @Column({ nullable: false })
  payed: boolean

  @Column({ name: 'success_date', nullable: false })
  successDate: Date

  @Column({ length: 255, nullable: false })
  event: string
}
