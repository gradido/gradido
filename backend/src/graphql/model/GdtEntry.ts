import { GdtEntryType } from '@enum/GdtEntryType'
import { Field, Float, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class GdtEntry {
  constructor({
    id,
    amount,
    date,
    email,
    comment,

    coupon_code,

    gdt_entry_type_id,
    factor,
    amount2,
    factor2,
    gdt,
  }: any) {
    this.id = id
    this.amount = amount
    this.date = date
    this.email = email
    this.comment = comment

    this.couponCode = coupon_code

    this.gdtEntryType = gdt_entry_type_id
    this.factor = factor
    this.amount2 = amount2
    this.factor2 = factor2
    this.gdt = gdt
  }

  @Field(() => Int)
  id: number

  @Field(() => Float)
  amount: number

  @Field(() => String)
  date: string

  @Field(() => String)
  email: string

  @Field(() => String)
  comment: string

  @Field(() => String)
  couponCode: string

  @Field(() => GdtEntryType)
  gdtEntryType: GdtEntryType

  @Field(() => Float)
  factor: number

  @Field(() => Float)
  amount2: number

  @Field(() => Float)
  factor2: number

  @Field(() => Float)
  gdt: number
}
