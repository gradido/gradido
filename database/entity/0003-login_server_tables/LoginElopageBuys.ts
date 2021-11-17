import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('login_elopage_buys')
export class LoginElopageBuys extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'elopage_user_id', nullable: false })
  elopageUserId: number

  @Column({ name: 'affiliate_program_id', nullable: false })
  affiliateProgramId: number

  @Column({ name: 'publisher_id', nullable: false })
  publisherId: number

  @Column({ name: 'order_id', nullable: false })
  orderId: number

  @Column({ name: 'product_id', nullable: false })
  productId: number

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
