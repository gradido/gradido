/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectType, Field, Float, Int } from 'type-graphql'

import { GdtEntryType } from '@enum/GdtEntryType'

@ObjectType()
export class GdtEntry {
  constructor({
    id,
    amount,
    date,
    email,
    comment,
    // eslint-disable-next-line camelcase
    coupon_code,
    // eslint-disable-next-line camelcase
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
    // eslint-disable-next-line camelcase
    this.couponCode = coupon_code
    // eslint-disable-next-line camelcase
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
